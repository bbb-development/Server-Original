import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import fs from 'fs';
const templates = JSON.parse(
  await readFile(new URL('./Templates/Functions/Templates.json', import.meta.url))
);

// Add a constant to control proxy usage
const useProxy = true; // Set to false to disable proxy
const proxyToUse = 'webshare' // 'dataimpulse' or 'webshare'

import {
  extractImages,
  scrapeButtonColors,
  scrapeLogo,
  getBrandData,
  extractBestSellers
} from './Brand Brief Functions/scraper_index.js';

console.log('🚀 Initializing server scraper...');

// Proxy setup
const proxyConfig = {
  server: proxyToUse === 'webshare' ? process.env.WEBSHARE_SERVER : process.env.DATAIMPULSE_SERVER,
  username: proxyToUse === 'webshare' ? process.env.WEBSHARE_USERNAME : process.env.DATAIMPULSE_USERNAME,
  password: proxyToUse === 'webshare' ? process.env.WEBSHARE_PASSWORD : process.env.DATAIMPULSE_PASSWORD
};

console.log('✅ Proxy configuration loaded --> Using ' + proxyToUse + ' rotating proxy');

// Helper to create a new context and page with proxy and cookies
async function createContextAndPage(browser, cookies) {
  const context = useProxy
    ? await browser.newContext({ proxy: proxyConfig })
    : await browser.newContext();

  if (cookies?.length) {
    await context.addCookies(cookies);
  }
  const page = await context.newPage();
  return { context, page };
}

// Helper function to navigate with retry logic
async function navigateWithRetry(page, url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🌐 Navigating to ${url}... (Attempt ${attempt}/${maxRetries})`);
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Additional wait to ensure page is fully stable
      await page.waitForTimeout(2000);
      
      // Try to wait for body to be present as an additional check
      try {
        await page.waitForSelector('body', { timeout: 5000 });
      } catch (e) {
        console.log('⚠️ Body selector not found, but continuing...');
      }
      
      console.log('✅ Page loaded successfully');
      return; // Success, exit the retry loop
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`⚠️ Navigation failed on attempt ${attempt} (${error.name || 'Unknown Error'}): ${error.message}`);
        console.log(`🔄 Retrying in 2 seconds...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // We've exhausted retries
        console.log(`❌ All ${maxRetries} navigation attempts failed for ${url}`);
        throw error;
      }
    }
  }
}

// Helper function to retry any async operation
async function withRetries(fn, maxRetries = 5, delayMs = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 Retrying operation (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delayMs));
      }
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`❌ Error on attempt ${attempt}:`, err);
    }
  }
  throw lastError;
}

// Helper function to retry page.content or scraping if page is navigating
async function withPageContentRetries(fn, maxRetries = 5, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 Retrying page content operation (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, delayMs));
      }
      return await fn();
    } catch (err) {
      lastError = err;
      if (
        err.message &&
        err.message.includes('page is navigating and changing the content')
      ) {
        console.warn(`⚠️ Page is navigating, retrying in ${delayMs}ms...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

(async () => {
  try {
    console.log('🚀 Launching browser...');
    const browser = await chromium.launch({ headless: true });
    console.log('✅ Browser launched successfully');

    const app = express();

    // Set up CORS with dynamic origin checking for security
    const allowedOrigins = [
      'https://flow-fast.ai',
      'https://www.flow-fast.ai',
      'http://localhost:3000', // Common local dev ports
      'http://localhost:5173', // Vite's default port
    ];

    app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      credentials: true,
    }));
    
    // --> ADDING THIS LOGGING MIDDLEWARE
    app.use((req, res, next) => {
      console.log('--- Incoming Request ---');
      console.log(`Method: ${req.method}`);
      console.log(`URL: ${req.originalUrl}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('------------------------');
      next();
    });
    
    // Middleware to parse JSON bodies
    app.use(express.json({ limit: '10mb' }));

    // Scrape endpoint
    app.post('/scrape', async (req, res) => {
      try {
        const { method, url, cookies } = req.body;
        console.log(`📥 Received request: ${method} for ${url}`);

        let result;
        let context, page;
        switch (method) {
          case 'scrape_html': {
            result = await withRetries(async () => {
              ({ context, page } = await createContextAndPage(browser, cookies));
              try {
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                const html = await page.content();
                return { ok: true, html };
              } finally {
                if (page) await page.close();
                if (context) await context.close();
              }
            });
            break;
          }
          case 'scrape_brand_brief': {
            result = await withRetries(async () => {
              ({ context, page } = await createContextAndPage(browser, cookies));
              try {
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                console.log('✅ Page loaded successfully');
                const startTime = Date.now(); // Start timing
                const scrapingTasks = [
                  withPageContentRetries(() => scrapeButtonColors(page)),
                  withPageContentRetries(() => scrapeLogo(page)),
                  withPageContentRetries(() => getBrandData(page)),
                  withPageContentRetries(() => extractImages(url)) 
                ];

                const results = await Promise.allSettled(scrapingTasks);

                const buttonData = results[0].status === 'fulfilled' ? results[0].value : { mostCommonBackground: null, mostCommonTextColor: null };
                const logoResult = results[1].status === 'fulfilled' ? results[1].value : null;
                const brandData = results[2].status === 'fulfilled' ? results[2].value : null;
                const extractedImages = results[3].status === 'fulfilled' ? results[3].value : []; 

                const resultData = {
                  brand: {
                    url,
                    logo: logoResult
                      ? {
                          url: logoResult.url || null,
                          width: logoResult.width || null,
                          height: logoResult.height || null
                        }
                      : null,
                    colors: {
                      background: buttonData?.mostCommonBackground || null,
                      text: buttonData?.mostCommonTextColor || null
                    },
                    data: brandData,
                    images: extractedImages.map(img => ({
                      id: img.id,
                      url: img.url
                    }))
                  },
                  meta: {
                    scrapedAt: new Date().toISOString(),
                    source: "server_scraper",
                  }
                };

                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✅ Brand brief scraping completed in ${elapsed} seconds`);
                return { ok: true, data: resultData };
              } finally {
                if (page) await page.close();
                if (context) await context.close();
              }
            });
            break;
          }
          case 'extractBestSellers': {
            result = await withRetries(async () => {
              ({ context, page } = await createContextAndPage(browser, cookies));
              try {
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                console.log('✅ Page loaded successfully');
                const bestSellersResult = await extractBestSellers(page);
                return {
                  ok: true,
                  data: {
                    links: {
                      best_sellers: {
                        url: bestSellersResult.bestSellersUrl || null,
                        products: bestSellersResult.bestSellers?.products || []
                      },
                      contact: {
                        url: bestSellersResult.contactUrl || null
                      },
                      faq: {
                        url: bestSellersResult.faqUrl || null
                      },
                      internal: bestSellersResult.internalLinks || null
                    }
                  }
                };
              } finally {
                if (page) await page.close();
                if (context) await context.close();
              }
            });
            break;
          }
          case 'scrape_combined': {
            // Demonstrate concurrent scraping with navigateWithRetry
            const startTime = Date.now();
            console.log(`🚀 Running combined scraping for ${url}...`);
            result = await withRetries(async () => {
              // Create two separate contexts and pages
              const brandBriefTask = (async () => {
                let context1, page1;
                ({ context: context1, page: page1 } = await createContextAndPage(browser, cookies));
                try {
                  console.log(`🌐 [Brand Brief] Navigating to ${url}...`);
                  await navigateWithRetry(page1, url);
                  console.log('✅ [Brand Brief] Page loaded successfully');
                  const scrapingTasks = [
                    withPageContentRetries(() => scrapeButtonColors(page1)),
                    withPageContentRetries(() => scrapeLogo(page1)),
                    withPageContentRetries(() => getBrandData(page1)),
                    withPageContentRetries(() => extractImages(url)) 
                  ];

                  const results = await Promise.allSettled(scrapingTasks);
                  const buttonData = results[0].status === 'fulfilled' ? results[0].value : { mostCommonBackground: null, mostCommonTextColor: null };
                  const logoResult = results[1].status === 'fulfilled' ? results[1].value : null;
                  const brandData = results[2].status === 'fulfilled' ? results[2].value : null;
                  const extractedImages = results[3].status === 'fulfilled' ? results[3].value : []; 

                  return {
                    brand: {
                      url,
                      logo: logoResult
                        ? {
                            url: logoResult.url || null,
                            width: logoResult.width || null,
                            height: logoResult.height || null
                          }
                        : null,
                      colors: {
                        background: buttonData?.mostCommonBackground || null,
                        text: buttonData?.mostCommonTextColor || null
                      },
                      data: brandData,
                      images: extractedImages.map(img => ({
                        id: img.id,
                        url: img.url
                      }))
                    }
                  };
                } finally {
                  if (page1) await page1.close();
                  if (context1) await context1.close();
                }
              })();

              const bestSellersTask = (async () => {
                let context2, page2;
                ({ context: context2, page: page2 } = await createContextAndPage(browser, cookies));
                try {
                  console.log(`🌐 [Best Sellers] Navigating to ${url}...`);
                  await navigateWithRetry(page2, url);
                  console.log('✅ [Best Sellers] Page loaded successfully');
                  const bestSellersResult = await extractBestSellers(page2);
                  return {
                    links: {
                      best_sellers: {
                        url: bestSellersResult.bestSellersUrl || null,
                        products: bestSellersResult.bestSellers?.products || []
                      },
                      contact: {
                        url: bestSellersResult.contactUrl || null
                      },
                      faq: {
                        url: bestSellersResult.faqUrl || null
                      },
                      internal: bestSellersResult.internalLinks || null
                    }
                  };
                } finally {
                  if (page2) await page2.close();
                  if (context2) await context2.close();
                }
              })();

              // Run both tasks concurrently
              const [brandBriefData, bestSellersData] = await Promise.all([brandBriefTask, bestSellersTask]);
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              console.log(`✅ Combined scraping completed in ${elapsed} seconds`);
              return {
                ok: true,
                data: {
                  ...brandBriefData,
                  ...bestSellersData,
                  meta: {
                    scrapedAt: new Date().toISOString(),
                    source: "server_scraper",
                    combinedScraping: true,
                    duration: elapsed + 's'
                  }
                }
              };
            });
            break;
          }
          case 'scrape_progressive': {
            // Demonstrate progressive results - returns whichever is ready first
            const startTime = Date.now();
            console.log(`🚀 Running progressive scraping for ${url}...`);
            result = await withRetries(async () => {
              // Create two separate contexts and pages
              const brandBriefTask = (async () => {
                let context1, page1;
                ({ context: context1, page: page1 } = await createContextAndPage(browser, cookies));
                try {
                  console.log(`🌐 [Brand Brief] Navigating to ${url}...`);
                  await navigateWithRetry(page1, url);
                  console.log('✅ [Brand Brief] Page loaded successfully');
                  const scrapingTasks = [
                    withPageContentRetries(() => scrapeButtonColors(page1)),
                    withPageContentRetries(() => scrapeLogo(page1)),
                    withPageContentRetries(() => getBrandData(page1)),
                    withPageContentRetries(() => extractImages(url)) 
                  ];

                  const results = await Promise.allSettled(scrapingTasks);
                  const buttonData = results[0].status === 'fulfilled' ? results[0].value : { mostCommonBackground: null, mostCommonTextColor: null };
                  const logoResult = results[1].status === 'fulfilled' ? results[1].value : null;
                  const brandData = results[2].status === 'fulfilled' ? results[2].value : null;
                  const extractedImages = results[3].status === 'fulfilled' ? results[3].value : []; 

                  return {
                    type: 'brand_brief',
                    brand: {
                      url,
                      logo: logoResult
                        ? {
                            url: logoResult.url || null,
                            width: logoResult.width || null,
                            height: logoResult.height || null
                          }
                        : null,
                      colors: {
                        background: buttonData?.mostCommonBackground || null,
                        text: buttonData?.mostCommonTextColor || null
                      },
                      data: brandData,
                      images: extractedImages.map(img => ({
                        id: img.id,
                        url: img.url
                      }))
                    }
                  };
                } finally {
                  if (page1) await page1.close();
                  if (context1) await context1.close();
                }
              })();

              const bestSellersTask = (async () => {
                let context2, page2;
                ({ context: context2, page: page2 } = await createContextAndPage(browser, cookies));
                try {
                  console.log(`🌐 [Best Sellers] Navigating to ${url}...`);
                  await navigateWithRetry(page2, url);
                  console.log('✅ [Best Sellers] Page loaded successfully');
                  const bestSellersResult = await extractBestSellers(page2);
                  return {
                    type: 'best_sellers',
                    links: {
                      best_sellers: {
                        url: bestSellersResult.bestSellersUrl || null,
                        products: bestSellersResult.bestSellers?.products || []
                      },
                      contact: {
                        url: bestSellersResult.contactUrl || null
                      },
                      faq: {
                        url: bestSellersResult.faqUrl || null
                      },
                      internal: bestSellersResult.internalLinks || null
                    }
                  };
                } finally {
                  if (page2) await page2.close();
                  if (context2) await context2.close();
                }
              })();

              // Use Promise.allSettled to handle results as they come
              const results = await Promise.allSettled([brandBriefTask, bestSellersTask]);
              const completedResults = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);
              const failedResults = results
                .filter(r => r.status === 'rejected')
                .map(r => ({ error: r.reason.message }));
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              console.log(`✅ Progressive scraping completed in ${elapsed} seconds`);
              console.log(`✅ Completed: ${completedResults.length}, Failed: ${failedResults.length}`);
              return {
                ok: true,
                data: {
                  completed: completedResults,
                  failed: failedResults,
                  meta: {
                    scrapedAt: new Date().toISOString(),
                    source: "server_scraper",
                    progressiveScraping: true,
                    duration: elapsed + 's',
                    completedCount: completedResults.length,
                    failedCount: failedResults.length
                  }
                }
              };
            });
            break;
          }
          default:
            throw new Error(`Unknown scraping method: ${method}`);
        }

        console.log('✅ Resources cleaned up');
        res.status(200).json(result);
      } catch (err) {
        console.error('❌ Scraping error:', err);
        res.status(500).json({ ok: false, error: err.message });
      }
    });
    
    // Template generation endpoint
    app.post('/make_template', async (req, res) => {
      try {
        const { templateId, templateData } = req.body;
        if (!templateId || !templateData) {
          return res.status(400).json({ ok: false, error: 'Missing templateId or templateData' });
        }
        // Find the template object by ID in all folders
        let selectedTemplate = null;
        for (const group of Object.values(templates)) {
          const found = group.find(t => t.id === templateId);
          if (found) {
            selectedTemplate = found;
            break;
          }
        }
        if (!selectedTemplate) {
          return res.status(404).json({ ok: false, error: 'Template not found for ID: ' + templateId });
        }
        // Dynamically import the template file
        const { generateTemplate } = await import('./' + selectedTemplate.location);
        // Generate the template - properly await the result which might be async
        const result = await Promise.resolve(generateTemplate(templateData));
        res.status(200).json({ ok: true, result });
      } catch (err) {
        console.error('❌ Template generation error:', err);
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    // Klaviyo data endpoints - simplified to avoid regex issues
    app.get('/klaviyo-cookies', (req, res) => handleKlaviyoRequest('cookies', req, res));
    app.get('/klaviyo-instance', (req, res) => handleKlaviyoRequest('instance', req, res));

    function handleKlaviyoRequest(type, req, res) {
      // Check API key authentication
      const authHeader = req.headers.authorization;
      const expectedKey = process.env.KLAVIYO_COOKIES_ACCESS_API_KEY;
      console.log(`Fetching Klaviyo ${type}...`);
      
      if (!expectedKey) {
        return res.status(500).json({ 
          ok: false, 
          error: 'API key not configured on server' 
        });
      }
      
      if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
        console.log("Unauthorized - Invalid or missing API key");
        return res.status(401).json({ 
          ok: false, 
          error: 'Unauthorized - Invalid or missing API key' 
        });
      }
      
      try {
        const cookiesFilePath = './Klaviyo Automated Login/kaloyan@bbb-marketing.com_cookies.json';
        const instanceFilePath = './Klaviyo Automated Login/saved_axios_instance.json';
        
        let filePath, fileType;
        if (type === 'cookies') {
          filePath = cookiesFilePath;
          fileType = 'cookies';
        } else if (type === 'instance') {
          filePath = instanceFilePath;
          fileType = 'axios instance';
        }
        
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf-8');
          const parsedData = JSON.parse(fileData);
          const stats = fs.statSync(filePath);
          
          if (type === 'cookies') {
            res.status(200).json({ 
              ok: true, 
              cookies: parsedData,
              lastUpdated: stats.mtime,
              fileSize: stats.size
            });
          } else {
            res.status(200).json({ 
              ok: true, 
              instance: parsedData,
              lastUpdated: stats.mtime,
              fileSize: stats.size
            });
          }
          console.log(`Klaviyo ${fileType} fetched successfully`);
        } else {
          res.status(404).json({ 
            ok: false, 
            error: `Klaviyo ${fileType} file not found`,
            expectedPath: filePath
          });
        }
      } catch (error) {
        res.status(500).json({ 
          ok: false, 
          error: `Failed to read ${type} file: ` + error.message 
        });
      }
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Express server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Fatal server error:', error);
    process.exit(1);
  }
})();