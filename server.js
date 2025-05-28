import { createServer } from 'http';
import { chromium } from 'playwright';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import fs from 'fs';
const templates = JSON.parse(
  await readFile(new URL('./Templates/Functions/Templates.json', import.meta.url))
);

// Add a constant to control proxy usage
const useProxy = true; // Set to false to disable proxy

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
  server: 'http://p.webshare.io:80',
  username: process.env.WEBSHARE_USERNAME,
  password: process.env.WEBSHARE_PASSWORD
};

console.log('✅ Proxy configuration loaded');

// Helper to create a new context and page with proxy and cookies
async function createContextAndPage(browser, cookies) {
  const context = useProxy
    ? await browser.newContext({ proxy: proxyConfig })
    : await browser.newContext();

    if (useProxy) {
      console.log('🌐 Using Webshare rotating proxy');
    } else {
      console.log('🌐 Not using proxy');
    }
    
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
      console.log(`🌐 Navigating to ${url}... (Attempt ${attempt}/${maxRetries})`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('✅ Page loaded successfully');
      return; // Success, exit the retry loop
    } catch (error) {
      if (error.name === 'TimeoutError' && attempt < maxRetries) {
        console.log(`⚠️ Navigation timeout on attempt ${attempt}, retrying...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Either not a timeout error or we've exhausted retries
        throw error;
      }
    }
  }
}

(async () => {
  try {
    console.log('🚀 Launching browser...');
    const browser = await chromium.launch({ headless: true });
    console.log('✅ Browser launched successfully');

    const server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/scrape') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { method, url, cookies } = JSON.parse(body);
            console.log(`📥 Received request: ${method} for ${url}`);

            let result;
            let context, page;
            switch (method) {
              case 'scrape_html': {
                ({ context, page } = await createContextAndPage(browser, cookies));
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                const html = await page.content();
                result = { ok: true, html };
                break;
              }
              case 'scrape_brand_brief': {
                ({ context, page } = await createContextAndPage(browser, cookies));
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                console.log('✅ Page loaded successfully');
                const startTime = Date.now(); // Start timing
                const scrapingTasks = [
                  scrapeButtonColors(page),
                  scrapeLogo(page),
                  getBrandData(page),
                  extractImages(url) 
                ];

                const results = await Promise.allSettled(scrapingTasks);

                const taskNames = ['Button Colors', 'Logo', 'Brand Data', 'Images'];

                results.forEach((r, i) => {
                  if (r.status === 'fulfilled') {
                    console.log(`✅ ${taskNames[i]} scraping successful`);
                  } else {
                    console.error(`❌ ${taskNames[i]} scraping failed:`, r.reason);
                  }
                });

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

                result = { ok: true, data: resultData };
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✅ Brand brief scraping completed in ${elapsed} seconds`);
                break;
              }
              case 'extractBestSellers': {
                ({ context, page } = await createContextAndPage(browser, cookies));
                console.log(`🌐 Navigating to ${url}...`);
                await navigateWithRetry(page, url);
                console.log('✅ Page loaded successfully');
                const bestSellersResult = await extractBestSellers(page);
                result = {
                  ok: true,
                  data: {
                    links: {
                      best_sellers: {
                        url: bestSellersResult.bestSellersUrl || null,
                        products: bestSellersResult.bestSellers?.products || []
                      },
                      internal: bestSellersResult.internalLinks || null
                    }
                  }
                };
                break;
              }
              default:
                throw new Error(`Unknown scraping method: ${method}`);
            }

            if (page) await page.close();
            if (context) await context.close();
            console.log('✅ Resources cleaned up');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('❌ Scraping error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      } else if (req.method === 'POST' && req.url === '/make_template') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { templateId, templateData } = JSON.parse(body);
            if (!templateId || !templateData) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'Missing templateId or templateData' }));
              return;
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
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'Template not found for ID: ' + templateId }));
              return;
            }
            // Dynamically import the template file
            const { generateTemplate } = await import('./' + selectedTemplate.location);
            // Generate the template - properly await the result which might be async
            const result = await Promise.resolve(generateTemplate(templateData));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, result }));
          } catch (err) {
            console.error('❌ Template generation error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
        return;
      } else if (req.method === 'GET' && req.url === '/klaviyo-cookies') {
        // Check API key authentication
        const authHeader = req.headers.authorization;
        const expectedKey = process.env.KLAVIYO_COOKIES_ACCESS_API_KEY;
        console.log("Fetching Klaviyo cookies...");
        
        if (!expectedKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            ok: false, 
            error: 'API key not configured on server' 
          }));
          return;
        }
        
        if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            ok: false, 
            error: 'Unauthorized - Invalid or missing API key' 
          }));
          console.log("Unauthorized - Invalid or missing API key");
          return;
        }
        
        try {
          const cookiesFilePath = './Klaviyo Automated Login/kaloyan@bbb-marketing.com_cookies.json';
          
          if (fs.existsSync(cookiesFilePath)) {
            const cookieData = fs.readFileSync(cookiesFilePath, 'utf-8');
            const cookies = JSON.parse(cookieData);
            const stats = fs.statSync(cookiesFilePath);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              ok: true, 
              cookies: cookies,
              lastUpdated: stats.mtime,
              fileSize: stats.size
            }));
            console.log("Klaviyo cookies fetched successfully");
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              ok: false, 
              error: 'Klaviyo cookies file not found',
              expectedPath: cookiesFilePath
            }));
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            ok: false, 
            error: 'Failed to read cookies file: ' + error.message 
          }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Bare Node.js server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Fatal server error:', error);
    process.exit(1);
  }
})();