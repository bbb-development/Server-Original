import brandfetch, { BrandfetchAPI, searchBrands, getBrandData, getLogoUrl, getBrandfetchUsage } from './tools/brandfetch.js';
import { askGemini } from './tools/gemini.js';
import firecrawl, { scrape, map, extract, screenshot, toMarkdown, getFirecrawlUsage } from './tools/firecrawl.js';
import { generateDeliverabilitySnippet } from './brand-analyzer.js';




////// BRANDFETCH TEST ////////

// Check Brandfetch usage and credits
await getBrandfetchUsage();

// Search for brands (FREE)
//const brands = await searchBrands('Nike');
//console.log('Brand Search Results:', JSON.stringify(brands, null, 2));

// Get complete brand data (PAID)
//const brandData = await getBrandData('crystalenergy.shop');
//console.log('Brand Data:', JSON.stringify(brandData, null, 2));

// Get logo URLs (FREE)
//const logoUrl = getLogoUrl('nike.com', { theme: 'dark', size: 128 });
//console.log('Logo URL:', JSON.stringify(logoUrl, null, 2));

// Combined search + data
//const completeData = await brandfetch.searchAndGetBrandData('Nike');
//console.log('Complete Data:', JSON.stringify(completeData, null, 2));

// Get brand summary
//const summary = await brandfetch.getBrandSummary('crystalenergy.shop');
//console.log('Summary:', JSON.stringify(summary, null, 2));





////// GEMINI TEST //////

//const deliverabilitySnippet = await generateDeliverabilitySnippet('https://crystalenergy.shop');
//console.log('Deliverability Snippet:', deliverabilitySnippet);

//const result = await askGemini("Hello, how are you?");
//console.log(result);

////// FIRECRAWL TEST //////

// Check Firecrawl usage and credits
//await getFirecrawlUsage();

// Basic scraping
//const content = await scrape('https://crystalenergy.shop');
//console.log('Scraped Content:', JSON.stringify(content, null, 2));

// Map all URLs on a website
//const siteMap = await map('https://crystalenergy.shop', {
//  includeSubdomains: true
//});
//console.log('Site Map:', JSON.stringify(siteMap, null, 2));

// AI-powered structured extraction
//const data = await extract('https://news.ycombinator.com', {
//  type: 'object',
//  properties: {
//    articles: {
//      type: 'array',
//      items: {
//        properties: {
//          title: { type: 'string' },
//          url: { type: 'string' }
//        }
//      }
//    }
//  }
//}, 'Extract all news articles with titles and URLs');
//console.log('Extracted Data:', JSON.stringify(data, null, 2));

// Interactive scraping with actions
//const result = await firecrawl.scrapeWithActions('https://google.com', [
//  { type: 'wait', milliseconds: 2000 },
//  { type: 'click', selector: 'textarea[title="Search"]' },
//  { type: 'write', text: 'firecrawl' },
//  { type: 'press', key: 'ENTER' },
//  { type: 'wait', milliseconds: 3000 }
//]);
//console.log('Interactive Scraping Result:', JSON.stringify(result, null, 2));

// Take screenshots
//const screenshott = await screenshot('https://crystalenergy.shop', true);
//console.log('Screenshot:', JSON.stringify(screenshott, null, 2));

// Clean markdown conversion
//const markdown = await toMarkdown('https://crystalenergy.shop/collections/best-sellers');
//console.log('Markdown:', JSON.stringify(markdown, null, 2));





