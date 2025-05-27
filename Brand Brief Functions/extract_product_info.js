import { mapInternalLinks } from './scraper_index.js';
import { askGemini, productListSchema, bestSellersSchema } from './askGemini.js';
import * as cheerio from 'cheerio';

async function scrapePageContent(page, url) {
  try {
    if (!url || !url.bestSellersUrl) {
      throw new Error('No valid URL provided for scraping');
    }

    // Block fonts AND CSS on the same page
    await page.route('**/*.{woff,woff2,css}', route => route.abort());

    // Navigate the SAME page to the best sellers URL
    await page.goto(url.bestSellersUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Scroll to the bottom in a glance
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Remove header, footer, and other unwanted elements from the DOM
    await page.evaluate(() => {
      const selectors = [
        'header', 'footer', '.header', '.footer', '#header', '#footer',
        'script', 'style', 'meta', 'link', 'noscript'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
    });

    // Get only the <body> content
    const bodyHtml = await page.evaluate(() => document.body.outerHTML);

    // Convert HTML to Markdown (text, links, images)
    const markdown = htmlToMarkdown(bodyHtml);
    console.log('✅ Best sellers page content scraped');

    return markdown; // Success
  } catch (error) {
    console.error('Error scraping best seller page content:', error);
    throw error;
  }
}

function htmlToMarkdown(html) {
  const $ = cheerio.load(html);

  function extractImageLinks(img) {
    const srcs = [];
    const src = img.attr('src');
    if (src) srcs.push(src);
    const dataSrc = img.attr('data-src');
    if (dataSrc) srcs.push(dataSrc);
    const srcset = img.attr('srcset');
    if (srcset) srcs.push(...srcset.split(',').map(s => s.trim().split(' ')[0]));
    const dataSrcset = img.attr('data-srcset');
    if (dataSrcset) srcs.push(...dataSrcset.split(',').map(s => s.trim().split(' ')[0]));
    return [...new Set(srcs)];
  }

  // Recursively walk the DOM and build markdown inline
  function walk(node) {
    let md = '';
    node.contents().each((_, el) => {
      const $el = $(el);
      if (el.type === 'text') {
        md += $el.text();
      } else if (el.tagName === 'a') {
        const href = $el.attr('href');
        const text = walk($el);
        if (href) {
          md += `[${text}](${href})`;
        } else {
          md += text;
        }
      } else if (el.tagName === 'img') {
        const alt = $el.attr('alt') || '';
        const links = extractImageLinks($el);
        if (links.length) {
          // Output all unique image links inline
          md += links.map(link => `![${alt}](${link})`).join('');
        }
      } else if ([
        'p', 'div', 'section', 'article', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ].includes(el.tagName)) {
        // Block-level: add newlines before/after
        md += '\n' + walk($el) + '\n';
      } else {
        md += walk($el);
      }
    });
    return md;
  }

  let markdown = walk($('body'));
  // Clean up multiple newlines and trim, then remove empty/whitespace-only lines
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export async function extractBestSellers(page) {
    try {
        // First, get all internal links from the ORIGINAL page
        const internalLinks = await mapInternalLinks(page);
        console.log('✅ Internal links mapped from original page');

        // Create a prompt for GPT to analyze the links and find best sellers collection
        const linkAnalysisPrompt = `
        Analyze these internal links from the website and identify the URL that most likely contains the best sellers or most popular products collection.
        Return ONLY the URL, nothing else. If you can't find a clear best sellers link, return the most likely URL based on common naming patterns.

        Return the FULL URL in a JSON format:
        {
            "bestSellersUrl": "FULL URL"
        }

        Links:
        ${JSON.stringify(internalLinks, null, 2)}
        `;

        // Get the best sellers URL from GPT
        const bestSellersUrl = await askGemini(linkAnalysisPrompt, null, bestSellersSchema);
        let parsedUrlData;

        // Parse the best sellers URL response
        try {
          const cleanedUrlResponse = bestSellersUrl.replace(/```json\n|\n```/g, '').trim();
          parsedUrlData = JSON.parse(cleanedUrlResponse);

          if (!parsedUrlData.bestSellersUrl) {
            console.log('⚠️ No best sellers URL found, returning default structure');
            return {
              bestSellersUrl: null,
              bestSellers: { products: [] },
              internalLinks: internalLinks
            };
          }

          console.log('✅ Best sellers URL identified:', parsedUrlData.bestSellersUrl);
        } catch (error) {
          console.error('Error parsing best sellers URL:', error);
          return {
              bestSellersUrl: null,
              bestSellers: { products: [] },
              internalLinks: internalLinks
            };
        }

        // Pass the original page object to scrapePageContent
        const bestSellerPageHtml = await scrapePageContent(page, parsedUrlData);

        // Create a prompt for GPT to analyze the best sellers page content
        // *** Reverted Prompt: No longer mentions blocked images ***
        const scrapingPrompt = `
        Analyze the following content from the best sellers page and create a list of the top 9 best-selling products.
        For each product, include:
        1. Product name
        2. Price (if available)
        3. Product URL - IMPORTANT: Make it a full URL including the protocol, www and domain name.
        4. Product Image URL - IMPORTANT: Copy the EXACT image URL including all parameters (like ?v=, &width=, etc.)

        Sort the products from best-selling to least-selling based on any available indicators (position, sales numbers, etc.).
        Return the results in a clear, structured format.

        NOTE: I always want the top 9 products, don't make up any products if there are less than 9.

        Content to analyze:
        ${bestSellerPageHtml}
        `;

        // Use the web scraping tool to get the content and analyze it
        console.log('🔍 Analyzing best sellers with Gemini...');
        const bestSellersList = await askGemini(scrapingPrompt, null, productListSchema);
        console.log('✅ Best sellers list generated');

        // Parse the best sellers list response
        try {
          const cleanedListResponse = bestSellersList.replace(/```json\n|\n```/g, '').trim();
          const parsedListData = JSON.parse(cleanedListResponse);

          if (!Array.isArray(parsedListData)) {
            throw new Error('Invalid product list format - expected an array');
          }

          // Ensure each product has the required fields, handle missing price/image gracefully
          const validatedProducts = parsedListData.map(product => {
            const price = (product.productPrice !== undefined && product.productPrice !== null && product.productPrice !== '') ? product.productPrice : 'N/A';
            let imgUrl = (product.productImgUrl !== undefined && product.productImgUrl !== null && product.productImgUrl !== '') ? product.productImgUrl : 'N/A';
            // Normalize protocol-relative URLs
            if (typeof imgUrl === 'string' && imgUrl.startsWith('//')) {
              imgUrl = 'https:' + imgUrl;
            }

            // Now require Name, URL, and Image URL again, but allow N/A for image
             if (!product.productName || !product.productURL || !imgUrl) {
               console.warn('Product missing required fields (Name, URL, or ImgUrl found as invalid):', product);
               return null;
             }

            return {
              productName: product.productName,
              productURL: product.productURL,
              productPrice: price,
              productImgUrl: imgUrl // Use extracted or 'N/A'
            };
          }).filter(Boolean);

          return {
            bestSellersUrl: parsedUrlData.bestSellersUrl,
            bestSellers: { products: validatedProducts },
            internalLinks: internalLinks
          };
        } catch (error) {
          console.error('Error parsing best sellers list:', error);
          return {
            bestSellersUrl: parsedUrlData.bestSellersUrl,
            bestSellers: { products: [] },
            internalLinks: internalLinks
          };
        }

    } catch (error) {
        console.error('Error extracting best sellers:', error);
        return {
            bestSellersUrl: null,
            bestSellers: { products: [] },
            internalLinks: []
          };
    }
} 