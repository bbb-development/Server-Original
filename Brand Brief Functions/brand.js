import * as cheerio from 'cheerio';
import { askGemini, brandBriefSchema, brandBenefitsWithIconsSchema } from './askGemini.js';
import { getAlbumImagesData } from '../Templates/Functions/imgBB Integration.js';

async function htmlToMarkdown(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style').remove();
  
  // Get all text content
  const textContent = $('body').text()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Convert to markdown format
  return `# Website Content Analysis\n\n${textContent}`;
}

async function createBrandAnalysisPrompt(markdownContent) {
  return `Analyze the following website content and extract key brand information. 
Return ONLY a JSON object with the following fields:
- brandName: The name of the brand
- brandDescription: A concise description of what the brand does and its unique value proposition
- brandAudience: The primary target audience for the brand
- brandTone: The tone of voice used in the content (e.g., professional, friendly, authoritative)
- brandMessage: The core message or theme that comes across in the content
- topEmailText: A short text line that would fit as a text line in the header of emails under/above the logo. This should be something that makes sense regardless of the current season/month. Example: "90-Day Satisfaction & Money Back Guarantee". Use American English.
- aboutUs: An object containing three flowing paragraphs that tell the brand's story:
  {
    "paragraph1": "First paragraph starting with 'At [Brand Name], we...'",
    "paragraph2": "Second paragraph mentioning the best-seller and how it matches the first paragraph",
    "paragraph3": "Third paragraph flowing into the brand mission starting with 'That all ties into our mission to...'"
  }
  All paragraphs should be sharp, one-sentence paragraphs that flow well together. Use American English.

Website Content:
${markdownContent}

NOTE: The example above is just an example, don't follow it exactly, use the content to create a brand analysis!!.`;
}

async function scrapeFonts(page) {
  const fontAnalysis = {
    fonts: new Map(), // Map to store font usage details
    genericFonts: [
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
      'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
      'ui-rounded', 'emoji', 'math', 'fangsong'
    ]
  };

  // Analyze font usage in elements
  const elementAnalysis = await page.evaluate(() => {
    const analysis = new Map();
    const elements = document.getElementsByTagName('*');
    
    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const fontFamily = style.getPropertyValue('font-family');
      const text = element.textContent?.trim();
      
      if (fontFamily && text && text.length > 0) {
        const fonts = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
        const primaryFont = fonts[0]; // Get the first font in the stack
        
        if (!analysis.has(primaryFont)) {
          analysis.set(primaryFont, { count: 0 });
        }
        
        analysis.get(primaryFont).count++;
      }
    }
    return Array.from(analysis.entries());
  });

  // Process the analysis
  elementAnalysis.forEach(([font, data]) => {
    if (!fontAnalysis.genericFonts.includes(font.toLowerCase())) {
      fontAnalysis.fonts.set(font, { usageCount: data.count });
    }
  });

  // Sort fonts by usage count
  const sortedFonts = Array.from(fontAnalysis.fonts.entries())
    .sort((a, b) => b[1].usageCount - a[1].usageCount);

  // Format the results
  const results = sortedFonts.map(([font, data]) => ({
    font,
    usageCount: data.usageCount
  }));

  return results;
}

export async function getBrandData(page, shouldAnalyze = true, iconsAlbumId = "gvDF2X", iconsAlbumName = "Benefits Banner") {
  if (!shouldAnalyze) {
    return null;
  }
  console.log('Analyzing brand data...');
  
  try {
    // Add realistic browser behavior
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });

    // Wait for the page to be fully loaded and stable    
    await page.waitForLoadState('domcontentloaded');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const html = await page.content();
    
    // Scrape fonts with detailed analysis
    const fontAnalysis = await scrapeFonts(page);
    
    // Get just the font names of top 3
    const topFonts = fontAnalysis.slice(0, 3).map(({ font }) => font);
    console.log('Top fonts:', topFonts);

    const markdownContent = await htmlToMarkdown(html);
    
    // Make both API calls concurrently
    console.log('Making concurrent requests to Gemini...');
    const [brandAnalysisPromise, brandBenefitsPromise] = await Promise.allSettled([
      // First promise: Get general brand analysis
      (async () => {
        const prompt = await createBrandAnalysisPrompt(markdownContent);
        return await askGemini(prompt, null, brandBriefSchema);
      })(),
      
      // Second promise: Get brand benefits with icons
      generateBrandBenefitsWithIcons(markdownContent, iconsAlbumId, iconsAlbumName)
    ]);
    
    // Process brand analysis response
    let parsedBrandData = {
      brandName: "",
      brandDescription: "Not available due to error",
      brandAudience: "Not available due to error",
      brandTone: "Not available due to error", 
      brandMessage: "Not available due to error",
      topEmailText: "Not available due to error",
      aboutUs: {
        paragraph1: "Not available due to error",
        paragraph2: "Not available due to error",
        paragraph3: "Not available due to error"
      },
      brandBenefits: []
    };
    
    // Process main brand analysis
    if (brandAnalysisPromise.status === 'fulfilled') {
      try {
        // Clean up the response by removing markdown code block syntax
        const cleanedAnalysis = brandAnalysisPromise.value.replace(/```json\n|\n```/g, '').trim();
        parsedBrandData = JSON.parse(cleanedAnalysis);
      } catch (error) {
        console.error('Error parsing brand data:', error);
      }
    } else {
      console.error('Brand analysis failed:', brandAnalysisPromise.reason);
    }
    
    // Process brand benefits with icons
    if (brandBenefitsPromise.status === 'fulfilled' && brandBenefitsPromise.value.success) {
      parsedBrandData.brandBenefits = brandBenefitsPromise.value.brandBenefits;
      console.log(`Successfully added ${parsedBrandData.brandBenefits.length} brand benefits with icons`);
    } else {
      console.error('Brand benefits analysis failed:', 
        brandBenefitsPromise.status === 'rejected' ? 
          brandBenefitsPromise.reason : 
          (brandBenefitsPromise.value ? brandBenefitsPromise.value.error : 'Unknown error'));
    }
    
    // Return the combined results
    return {
      ...parsedBrandData,
      topFonts
    };
    
  } catch (error) {
    console.error('Error analyzing brand data:', error);
    if (error.message.includes('403')) {
      console.log('Received 403 Forbidden error. The website might be blocking automated access.');
      console.log('Trying to refresh the page and retry...');
      
      try {
        // Try to refresh the page
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000); // Wait 5 seconds after refresh
        
        const html = await page.content();
        const markdownContent = await htmlToMarkdown(html);
        
        // Make both API calls concurrently for the retry as well
        const [brandAnalysisPromise, brandBenefitsPromise] = await Promise.allSettled([
          // First promise: Get general brand analysis
          (async () => {
            const prompt = await createBrandAnalysisPrompt(markdownContent);
            return await askGemini(prompt, null, brandBriefSchema);
          })(),
          
          // Second promise: Get brand benefits with icons
          generateBrandBenefitsWithIcons(markdownContent, iconsAlbumId, iconsAlbumName)
        ]);
        
        // Process brand analysis response
        let parsedBrandData = {
          brandName: "",
          brandDescription: "Not available due to access restrictions",
          brandAudience: "Not available due to access restrictions",
          brandTone: "Not available due to access restrictions", 
          brandMessage: "Not available due to access restrictions",
          topEmailText: "Not available due to access restrictions",
          aboutUs: {
            paragraph1: "Not available due to access restrictions",
            paragraph2: "Not available due to access restrictions",
            paragraph3: "Not available due to access restrictions"
          },
          brandBenefits: []
        };
        
        // Process main brand analysis
        if (brandAnalysisPromise.status === 'fulfilled') {
          try {
            // Clean up the response by removing markdown code block syntax
            const cleanedAnalysis = brandAnalysisPromise.value.replace(/```json\n|\n```/g, '').trim();
            parsedBrandData = JSON.parse(cleanedAnalysis);
          } catch (error) {
            console.error('Error parsing brand data:', error);
          }
        } else {
          console.error('Brand analysis failed:', brandAnalysisPromise.reason);
        }
        
        // Process brand benefits with icons
        if (brandBenefitsPromise.status === 'fulfilled' && brandBenefitsPromise.value.success) {
          parsedBrandData.brandBenefits = brandBenefitsPromise.value.brandBenefits;
          console.log(`Successfully added ${parsedBrandData.brandBenefits.length} brand benefits with icons`);
        } else {
          console.error('Brand benefits analysis failed:', 
            brandBenefitsPromise.status === 'rejected' ? 
              brandBenefitsPromise.reason : 
              (brandBenefitsPromise.value ? brandBenefitsPromise.value.error : 'Unknown error'));
        }
        
        return {
          ...parsedBrandData,
          topFonts
        };
        
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return {
          brandName: "",
          brandDescription: "Not available due to access restrictions",
          brandAudience: "Not available due to access restrictions",
          brandTone: "Not available due to access restrictions",
          brandMessage: "Not available due to access restrictions",
          brandBenefits: [],
          topEmailText: "Not available due to access restrictions",
          aboutUs: {
            paragraph1: "Not available due to access restrictions",
            paragraph2: "Not available due to access restrictions",
            paragraph3: "Not available due to access restrictions"
          }
        };
      }
    }
    return {
      brandName: "",
      brandDescription: "Not available due to error",
      brandAudience: "Not available due to error",
      brandTone: "Not available due to error",
      brandMessage: "Not available due to error",
      brandBenefits: [],
      topEmailText: "Not available due to error",
      aboutUs: {
        paragraph1: "Not available due to error",
        paragraph2: "Not available due to error",
        paragraph3: "Not available due to error"
      }
    };
  }
}

export async function generateBrandBenefitsWithIcons(markdownContent, albumId, albumName) {
  try {
    console.log(`Generating brand benefits based on icons from album '${albumName}'...`);
    
    // Fetch all images data from the specified album
    const imagesData = await getAlbumImagesData(albumId, albumName);
    
    if (!imagesData || imagesData.length === 0) {
      console.error(`No icons found in album '${albumName}'. Cannot generate benefits.`);
      return {
        success: false,
        error: "No icons available",
        brandBenefits: []
      };
    }
    
    console.log("imagesData", imagesData);
    
    // Create a prompt for Gemini to generate benefits based on available icons
    const prompt = `We are an email agency. We do a benefits banner that is relevant for every email. The websites of our e-commerce clients often have a block like that on their website. Please take out the 3x clear benefits from this store.

General examples include stuff like 30-day money back guarantee, free shipping, and other similar store benefits.

Here's all the home page content:
${markdownContent}

Now that you have the home page content, please take out the 3x clear benefits from this store that match 3 icons from the list below.

Available Icons:
${imagesData.map((img, index) => `${index + 1}. Name: ${img.name}, DirectLink: ${img.directLink}${img.description ? ', Description: ' + img.description : ''}`).join('\n')}

IN SHORT: Analyze the home page content and take out the 3x clear benefits from this store that match 3 icons from the list below.

IMPORTANT:
Return ONLY a JSON object with the following field:
- brandBenefits: An array of 3 objects, each with a 'title', 'description', and 'DirectLink' to the icon describing clear store benefits. 
Example:
  [
    {
      "title": "Fast Delivery",
      "description": "Receive your order within 2-5 business days.",
      "DirectLink": "https://i.ibb.co/4nzyfpXM/Delivery-Truck.png"
    },
    {
      "title": "Money-back Guarantee",
      "description": "Shop with confidence – return your purchase within 14 days for a full refund.",
      "DirectLink": "https://i.ibb.co/C3QDYx40/Guarantee-Badge.png"
    },
    {
      "title": "High Quality",
      "description": "We offer only original and natural crystals, carefully selected for maximum energy and aesthetic effect.",
      "DirectLink": "https://i.ibb.co/Dft4XgyQ/Star.png"
    }
  ]
`;

    // Call Gemini API with the schema
    const response = await askGemini(prompt, null, brandBenefitsWithIconsSchema);
    
    // Parse the JSON response
    try {
      // Clean up the response by removing markdown code block syntax
      const cleanedResponse = response.replace(/```json\n|\n```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedResponse);
      
      return {
        success: true,
        brandBenefits: parsedResponse.brandBenefits,
        totalIconsAvailable: imagesData.length
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        success: false,
        error: "Failed to parse Gemini response",
        brandBenefits: []
      };
    }
  } catch (error) {
    console.error('Error generating brand benefits with icons:', error);
    return {
      success: false,
      error: error.message,
      brandBenefits: []
    };
  }
} 