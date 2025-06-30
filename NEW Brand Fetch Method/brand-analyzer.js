/**
 * Brand Analyzer
 * Combines brand data fetching and website mapping
 */

import brandfetch from './tools/brandfetch.js';
import firecrawl from './tools/firecrawl.js';
import { askGemini } from './tools/gemini.js';
import * as geminiSchemas from './tools/geminiSchemas.js';
import * as geminiPrompts from './tools/geminiPrompts.js';
import { getAlbumImagesData } from './tools/imgBB Integration.js';
import { getEmailImages } from './tools/getEmailHeaderImages.js';

/**
 * Main function to analyze a brand website
 * @param {string} url - The website URL to analyze
 * @param {Object} options - Optional configuration
 * @param {Object} options.mapOptions - Options for website mapping
 * @returns {Promise<Object>} Combined brand summary and site map
 */

async function analyzeBrand(url, shouldGetBestSellers = false, options = {}) {
  try {
    const startTime = Date.now();
    console.log(`\x1b[33m🔍 Analyzing brand: ${url}\x1b[0m`);
    
    // Clean URL (remove protocol for brand data lookup)
    const cleanDomain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    console.log('🚀 Running all analysis steps concurrently...');
    // Run all four steps concurrently with retry logic
    const [brandSummary, siteMap, geminiBrandBrief, brandBenefits, emailImagesData, deliverabilitySnippet] = await Promise.all([
      getBrandFetchData(cleanDomain),
      getBrandLinks(cleanDomain, shouldGetBestSellers, options.mapOptions),
      generateBrandBrief(url),
      generateBrandBenefits(url, "gvDF2X", "Benefits Banner"),
      getEmailImages(),
      generateDeliverabilitySnippet(url)
    ]);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\x1b[33m✅ Analysis complete in ${duration} seconds 🎉\x1b[0m`);

    console.log("🔍 Checking API Usage");
    await checkAPIUsage();
    
    return {
      url,
      domain: cleanDomain,
      brandSummary,
      specialLinks: siteMap.geminiURLs,
      bestSellers: siteMap.bestSellers,
      geminiBrandBrief,
      brandBenefits,
      emailImages: emailImagesData.emailImages,
      assistant: emailImagesData.assistant,
      deliverabilitySnippet,
      analysis: {
        totalPages: siteMap.links?.length || 0,
        hasLogo: brandSummary.logos?.length > 0,
        hasColors: brandSummary.colors?.length > 0,
        hasFonts: brandSummary.fonts?.length > 0,
        socialLinks: brandSummary.links?.length || 0,
        benefitsCount: brandBenefits?.length || 0,
        bestSellersCount: siteMap.bestSellers?.length || 0
      }
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${url}:`, error.message);
    throw error;
  }
}

/**
 * Map website structure and discover URLs
 * @param {string} domain - The domain to map
 * @param {Object} mapOptions - Optional mapping configuration
 * @returns {Promise<Object>} Site map with discovered URLs and best sellers
 */
async function getBrandLinks(domain, shouldGetBestSellers, mapOptions = {}) {
  console.log(`🔍 Getting Brand Links Using Firecrawl and Gemini`);
  // Get the site map with all links
  const siteMap = await getSiteMap(domain, mapOptions);
  
  // Extract special URLs using Gemini AI
  const geminiURLs = await extractSpecialURLs(siteMap.links);
  
  // Get best sellers products if URL is available
  const bestSellers = shouldGetBestSellers ? await getBestSellers(geminiURLs.bestSellersUrl) : [];
  
  return {
    links: siteMap.links || [],
    geminiURLs: geminiURLs,
    bestSellers: bestSellers
  };
}

/**
 * Get site map with all discovered URLs
 * @param {string} domain - The domain to map
 * @param {Object} mapOptions - Optional mapping configuration
 * @returns {Promise<Object>} Site map object with links
 */
async function getSiteMap(domain, mapOptions = {}) {
  try {
    const siteMap = await retryWithBackoff(
      () => firecrawl.map(domain, {
        includeSubdomains: false,
        limit: 1000,
        ...mapOptions
      }),
      6, // 6 retries
      1000, // 1 second base delay
      'Website mapping'
    );

    return siteMap;
  } catch (error) {
    console.warn(`⚠️ Failed to map website ${domain}, using fallback with basic URL`);
    // Fallback: return basic structure with just the main URL
    return {
      success: false,
      links: [domain.startsWith('http') ? domain : `https://${domain}`],
      error: error.message
    };
  }
}

/**
 * Extract special URLs (bestSellers, contact, FAQ) using Gemini AI
 * @param {Array} links - Array of website links to analyze
 * @returns {Promise<Object>} Object containing special URLs
 */
async function extractSpecialURLs(links) {
  try {
    const geminiURLsRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.fetchURLsPrompt(links), 
        { includeUrlContext: false }, 
        geminiSchemas.fetchURLsSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      'Special URLs extraction with Gemini'
    );
    
    // Parse the Gemini response
    let geminiURLs;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(geminiURLsRaw).replace(/undefined$/, '').trim();      
      geminiURLs = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini URLs response as JSON, using fallback');
      console.warn('Raw response that failed to parse:', geminiURLsRaw);
      geminiURLs = { bestSellersUrl: null, contactUrl: null, faqUrl: null };
    }
    
    return geminiURLs;
  } catch (error) {
    console.warn('⚠️ Failed to extract special URLs, using fallback');
    return { bestSellersUrl: null, contactUrl: null, faqUrl: null };
  }
}

/**
 * Generate brand brief using Gemini AI
 * @param {string} url - The website URL to analyze
 * @returns {Promise<Object>} Ordered brand brief object
 */
async function generateBrandBrief(url) {
  try {
    console.log(`🔍 Generating Brand Brief Using Gemini`);
    const geminiBrandBriefRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.brandBriefPrompt(url), 
        { includeUrlContext: true }, 
        geminiSchemas.brandBriefSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      `Brand brief generation for ${url}`
    );
    
    // Parse the JSON response
    let geminiBrandBrief;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(geminiBrandBriefRaw).replace(/undefined$/, '').trim();
      geminiBrandBrief = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini response as JSON, using raw response');
      geminiBrandBrief = geminiBrandBriefRaw;
    }
    
    // Reorder the parsed response
    return {
      brandName: geminiBrandBrief.brandName,
      brandDescription: geminiBrandBrief.brandDescription,
      brandAudience: geminiBrandBrief.brandAudience,
      brandTone: geminiBrandBrief.brandTone,
      brandMessage: geminiBrandBrief.brandMessage,
      topEmailText: geminiBrandBrief.topEmailText,
      aboutUs: geminiBrandBrief.aboutUs
    };
  } catch (error) {
    console.warn('⚠️ Failed to generate brand brief, using fallback');
    return {
      brandName: 'Unknown Brand',
      brandDescription: 'Brand description unavailable',
      brandAudience: 'General audience',
      brandTone: 'Professional',
      brandMessage: 'Brand message unavailable',
      topEmailText: 'Welcome to our store',
      aboutUs: {
        paragraph1: 'Brand information currently unavailable.',
        paragraph2: 'Please try again later.',
        paragraph3: 'We are working to provide you with accurate brand details.'
      }
    };
  }
}

/**
 * Generate brand benefits using Gemini AI
 * @param {string} url - The website URL to analyze
 * @param {string} albumId - The ID of the album to use for the icons
 * @param {string} albumName - The name of the album to use for the icons
 * @returns {Promise<Object>} Brand benefits with icons
 */
async function generateBrandBenefits(url, albumId, albumName) {
  try {
    console.log(`🔍 Generating Brand Benefits Using Gemini and ImgBB`);
    
    // Fetch all images data from the specified album with retry logic
    const imagesData = await retryWithBackoff(
      () => getAlbumImagesData(albumId, albumName),
      6, // 6 retries
      1000, // 1 second base delay
      `Album images fetching (${albumName})`
    );
    
    if (!imagesData || imagesData.length === 0) {
      console.error(`No icons found in album '${albumName}'. Cannot generate benefits.`);
      return [];
    }
    
    //console.log("imagesData", imagesData);

    const geminiBenefitsRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.brandBenefitsPrompt(url, imagesData), 
        { includeUrlContext: true }, 
        geminiSchemas.brandBenefitsSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      `Brand benefits generation for ${url}`
    );
    
    // Parse the JSON response
    let brandBenefitsResponse;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(geminiBenefitsRaw).replace(/undefined$/, '').trim();
      brandBenefitsResponse = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini benefits response as JSON, using raw response');
      brandBenefitsResponse = geminiBenefitsRaw;
    }
    
    // Return just the benefits array, not the wrapper object
    return brandBenefitsResponse.brandBenefits || [];
  } catch (error) {
    console.error('Error generating brand benefits with icons:', error);
    return [];
  }
}

/**
 * Get best sellers products from the best sellers page
 * @param {string} bestSellersUrl - The URL of the best sellers page
 * @returns {Promise<Array>} Array of best selling products
 */
async function getBestSellers(bestSellersUrl) {
  if (!bestSellersUrl) {
    console.log('⚠️ No best sellers URL found, skipping product extraction');
    return [];
  }

  try {
    console.log(`🛍️ FIRECRAWL: Scraping best sellers page: ${bestSellersUrl}`);
    
    // Get markdown content from the best sellers page with retry logic
    const markdownContent = await retryWithBackoff(
      () => firecrawl.toMarkdown(bestSellersUrl),
      6, // 6 retries
      1000, // 1 second base delay
      `Best sellers scraping (${bestSellersUrl})`
    );
    
    if (!markdownContent || markdownContent.length === 0) {
      console.warn('⚠️ No markdown content retrieved from best sellers page');
      return [];
    }

    //console.log(`📄 Retrieved ${markdownContent.length} characters of markdown content`);

    // Use Gemini to extract product data from the markdown
    const productsRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.productListPrompt(markdownContent), 
        { includeUrlContext: false }, 
        geminiSchemas.productListSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      'Product extraction with Gemini'
    );
    
    // Parse the JSON response
    let products;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(productsRaw).replace(/undefined$/, '').trim();
      products = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini products response as JSON, using fallback');
      console.warn('Raw response that failed to parse:', productsRaw);
      products = [];
    }
    
    console.log(`✅ GEMINI: Extracted ${products.length} products from best sellers page`);
    return products;
    
  } catch (error) {
    console.error('❌ Error getting best sellers:', error.message);
    return [];
  }
}

/**
 * Retry utility function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000, operationName = 'operation') {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay/1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Get brand summary with retry logic and fallback
 * @param {string} cleanDomain - Clean domain name
 * @returns {Promise<Object>} Brand summary data
 */
async function getBrandFetchData(cleanDomain) {
  console.log(`🔍 Getting Brand Fetch Data Using Brandfetch`);
  return retryWithBackoff(
    () => brandfetch.getBrandSummary(cleanDomain),
    6, // 6 retries
    1000, // 1 second base delay
    `Brand summary fetching for ${cleanDomain}`
  ).catch(error => {
    console.warn('⚠️ Failed to get brand summary, using fallback');
    return {
      name: 'Unknown Brand',
      domain: cleanDomain,
      links: [],
      logos: [],
      colors: [],
      fonts: []
    };
  });
}

export async function generateDeliverabilitySnippet(url) {
  try {
    console.log(`🔍 Generating Deliverability Snippet Using Gemini`);
    const geminiDeliverabilitySnippetRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.createDeliverabilitySnippetPrompt(url), 
        { includeUrlContext: true }, 
        geminiSchemas.deliverabilitySnippetSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      `Deliverability snippet generation for ${url}`
    );

    // Parse the JSON response
    let deliverabilityResponse;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(geminiDeliverabilitySnippetRaw).replace(/undefined$/, '').trim();
      deliverabilityResponse = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini deliverability response as JSON, using raw response');
      deliverabilityResponse = geminiDeliverabilitySnippetRaw;
    }

    //console.log('Deliverability Snippet:', deliverabilityResponse);

    // Return just the snippet content, not the wrapper object
    return deliverabilityResponse.deliverability_snippet || deliverabilityResponse;
  } catch (error) {
    console.error('Error generating deliverability snippet:', error);
    return null;
  }
}

async function checkAPIUsage() {
  // Check Firecrawl and Brandfetch usage concurrently
  await Promise.all([
    firecrawl.getFirecrawlUsage(),
    brandfetch.getBrandfetchUsage()
  ]);
}

// Export functions
export { 
  analyzeBrand, 
  getBrandLinks, 
  getSiteMap, 
  extractSpecialURLs, 
  getBestSellers,
  generateBrandBrief, 
  generateBrandBenefits,
  getBrandFetchData,
  retryWithBackoff
};
export default analyzeBrand;

//const result = await analyzeBrand('https://crystalenergy.shop', false);
//console.log(JSON.stringify(result, null, 2));
