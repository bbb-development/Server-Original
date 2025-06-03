import * as cheerio from 'cheerio';
import { askGemini, brandBriefSchema, brandBenefitsWithIconsSchema, deliverabilitySnippetSchema } from './askGemini.js';
import { getAlbumImagesData } from '../Templates/Functions/imgBB Integration.js';
import { getEmailImages } from './emailImages.js';

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

async function createDeliverabilitySnippetPrompt(markdownContent) {
  return `You are a deliverability snippet generator for transactional-style email content. Your job is to generate clean, non-promotional hidden HTML blocks that boost email deliverability and avoid spam filters. Use a neutral, logistical tone focused on shipping, processing, and account handling — never marketing.

### RULES TO FOLLOW:

1. Use **no more than 3 products** in the included list.
2. Avoid **every word and symbol** in the MASTER DO-NOT-USE LIST.
3. **Adjust brand and product names** slightly if needed to stay compliant.
4. If you're missing specific data like name or address, insert clean, generic placeholders.
   - Examples: \`Alex Green\`, \`789 Neutral Road\`, \`Techville, XX 12345\`, \`USD\`
5. It's okay if some sentences are **not fully grammatical** as long as no banned terms are used.
6. All content must be wrapped in a single \`<span style="color: transparent; display: none; ...">\` HTML block.
7. Keep the tone strictly **non-promotional**. Do not use emotional, urgent, or exaggerated language.
8. Never refer to this task as "an example" or say you're generating a snippet — just return the HTML block itself.

### MASTER DO-NOT-USE LIST:
❌ Words (Sorted Alphabetically)
Act fast
All
Amazing
Apply now
Best price
Bargain
Buy now
Call now
Cash bonus
Clearance
Click here
Congratulations
Confidential
Costs
Cure
Don't hesitate
Don't miss
Earn money
Easy terms
Eliminate debt
Exclusive deal
Final notice
Financial freedom
For you
Free
Feel free
Fast cash
Get access
Get it now
Get paid
Great
Guarantee
Hidden
Hidden charges
Hurry
Income
Incredible
Increase sales
Instant
Join now
Life
Limited offer
Limited time
Lowest price
Lowest rate
Make money
Miracle
New
No catch
No hidden fees
Not junk
Offer expires
Online biz
Only
Opportunity
Opt in
Order
Passwords
Perfect
Please
Promotional
Request
Restricted
Risk-free
Save big
Satisfaction guaranteed
Soon
Special promotion
Supplies
This isn't spam
This won't last
Traffic
Unsubscribe
Urgent
Visit our website
While supplies last
Winner
Work from home
You're a winner
You've been selected

❌ Symbols
$

### TEMPLATE FORMAT:
<div><span style="color: transparent; display: none; height: 0; max-height: 0; font-size: 1px; max-width: 0; opacity: 0; mso-hide: all; width: 0;">

#{Order Number} – Thank you for choosing {Company Name}. Your items are being prepared and will be dispatched shortly. Keep this message for reference.

Included:

1x {Product Name 1} – {Price 1}  
1x {Product Name 2} – {Price 2}  
1x {Product Name 3} – {Price 3}  

Applied: {Code Used} – {Discount Amount}

Subtotal: {Subtotal Amount}  
Shipping: Standard Service  
Taxes: 0.00  
Total: {Total Amount} {Currency}

Shipping Information:

{Customer Name}  
{Street Address}  
{City, State/Province, ZIP}  
{Country}

Information:

{Customer Name}  
{Street Address}  
{City, State/Province, ZIP}  
{Country}

Shipping Method: Standard (5–7 business days)

Delivery Information:

Package expected 7–10 business days from send-out. Tracking will be sent. Processing happens Monday to Friday, not holidays.

Not arrived within timeframe? Support team available. We're ready to help.

1. **Processing**: Typical timing is 1–2 business days. At high volume, allow 3–5. This is before transit.

2. **Shipping & Arrival**: Standard delivery may apply to qualifying baskets. Expedited options may show at checkout. Timing depends on method and region.

3. **Payment & Security**: Transactions encrypted. Details protected. Payment methods shown at checkout.

4. **Returns & Resolution**: Contact us within 7 days if item is damaged or incorrect. Instructions will follow. Shipping-related amounts may not be refundable if no mistake occurred.

5. **Privacy Statement**: Info used to manage account and fulfill inquiry. We don't share data unless required.

6. **Rights & Content**: Materials belong to {Company Name} or licensed parties. Protected by intellectual property laws.

Thank you again from {Company Name}. We appreciate your support.

Regards,  
The {Company Name} Team

</span></div>

### WEBSITE CONTENT TO ANALYZE:
${markdownContent}

### INSTRUCTIONS:
Based on the website content above, generate a single deliverability snippet using all rules above. Extract the company name and product information from the content. Use generic placeholders for missing info such as customer name or address.

Now generate a single deliverability snippet using all rules above. Use generic placeholders for missing info such as customer name or address.`;
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
    const [brandAnalysisPromise, brandBenefitsPromise, deliverabilitySnippetPromise, emailImagesPromise] = await Promise.allSettled([
      // First promise: Get general brand analysis
      (async () => {
        const prompt = await createBrandAnalysisPrompt(markdownContent);
        return await askGemini(prompt, null, brandBriefSchema);
      })(),
      
      // Second promise: Get brand benefits with icons
      generateBrandBenefitsWithIcons(markdownContent, iconsAlbumId, iconsAlbumName),
      
      // Third promise: Deliverability snippet
      (async () => {
        const prompt = await createDeliverabilitySnippetPrompt(markdownContent);
        return await askGemini(prompt, null, deliverabilitySnippetSchema);
      })(),
      
      // Fourth promise: Email images
      getEmailImages()
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
      brandBenefits: [],
      deliverabilitySnippet: "Not available due to error",
      emailImages: {},
      assistant: {
        assistant_img: "",
        assistant_name: "Not available due to error"
      }
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
    
    // Process deliverability snippet response
    if (deliverabilitySnippetPromise.status === 'fulfilled') {
      try {
        // Clean up the response by removing markdown code block syntax
        const cleanedSnippet = deliverabilitySnippetPromise.value.replace(/```json\n|\n```/g, '').trim();
        const parsedSnippet = JSON.parse(cleanedSnippet);
        parsedBrandData.deliverabilitySnippet = parsedSnippet.deliverability_snippet;
        console.log('Deliverability snippet generation successful');
      } catch (error) {
        console.error('Error parsing deliverability snippet:', error);
        parsedBrandData.deliverabilitySnippet = deliverabilitySnippetPromise.value; // Fallback to raw response
      }
    } else {
      console.error('Deliverability snippet generation failed:', deliverabilitySnippetPromise.reason);
    }
    
    // Process email images response
    if (emailImagesPromise.status === 'fulfilled') {
      parsedBrandData.emailImages = emailImagesPromise.value.emailImages;
      parsedBrandData.assistant = emailImagesPromise.value.assistant;
      const imageCount = Object.keys(emailImagesPromise.value.emailImages).length;
      console.log(`Successfully fetched images for ${imageCount} email templates`);
      console.log(`Successfully set assistant: ${emailImagesPromise.value.assistant.assistant_name}`);
    } else {
      console.error('Email images fetch failed:', emailImagesPromise.reason);
      parsedBrandData.emailImages = {};
      parsedBrandData.assistant = {
        assistant_img: "",
        assistant_name: "Error occurred"
      };
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
        const [brandAnalysisPromise, brandBenefitsPromise, deliverabilitySnippetPromise, emailImagesPromise] = await Promise.allSettled([
          // First promise: Get general brand analysis
          (async () => {
            const prompt = await createBrandAnalysisPrompt(markdownContent);
            return await askGemini(prompt, null, brandBriefSchema);
          })(),
          
          // Second promise: Get brand benefits with icons
          generateBrandBenefitsWithIcons(markdownContent, iconsAlbumId, iconsAlbumName),
          
          // Third promise: Deliverability snippet
          (async () => {
            const prompt = await createDeliverabilitySnippetPrompt(markdownContent);
            return await askGemini(prompt, null, deliverabilitySnippetSchema);
          })(),
          
          // Fourth promise: Email images
          getEmailImages()
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
          brandBenefits: [],
          deliverabilitySnippet: "Not available due to access restrictions",
          emailImages: {},
          assistant: {
            assistant_img: "",
            assistant_name: "Not available due to access restrictions"
          }
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
        
        // Process deliverability snippet response
        if (deliverabilitySnippetPromise.status === 'fulfilled') {
          try {
            // Clean up the response by removing markdown code block syntax
            const cleanedSnippet = deliverabilitySnippetPromise.value.replace(/```json\n|\n```/g, '').trim();
            const parsedSnippet = JSON.parse(cleanedSnippet);
            parsedBrandData.deliverabilitySnippet = parsedSnippet.deliverability_snippet;
            console.log('Deliverability snippet generation successful');
          } catch (error) {
            console.error('Error parsing deliverability snippet:', error);
            parsedBrandData.deliverabilitySnippet = deliverabilitySnippetPromise.value; // Fallback to raw response
          }
        } else {
          console.error('Deliverability snippet generation failed:', deliverabilitySnippetPromise.reason);
        }
        
        // Process email images response
        if (emailImagesPromise.status === 'fulfilled') {
          parsedBrandData.emailImages = emailImagesPromise.value.emailImages;
          parsedBrandData.assistant = emailImagesPromise.value.assistant;
          const imageCount = Object.keys(emailImagesPromise.value.emailImages).length;
          console.log(`Successfully fetched images for ${imageCount} email templates`);
          console.log(`Successfully set assistant: ${emailImagesPromise.value.assistant.assistant_name}`);
        } else {
          console.error('Email images fetch failed:', emailImagesPromise.reason);
          parsedBrandData.emailImages = {};
          parsedBrandData.assistant = {
            assistant_img: "",
            assistant_name: "Error occurred"
          };
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
          },
          deliverabilitySnippet: "Not available due to access restrictions",
          emailImages: {},
          assistant: {
            assistant_img: "",
            assistant_name: "Not available due to access restrictions"
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
      },
      deliverabilitySnippet: "Not available due to error",
      emailImages: {},
      assistant: {
        assistant_img: "",
        assistant_name: "Not available due to error"
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