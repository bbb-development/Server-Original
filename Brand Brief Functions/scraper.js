import * as cheerio from 'cheerio';
import { analyzeButtonColorsFromScreenshot } from './image.js';

function findMostCommonColor(buttons, property) {
  const colorCounts = buttons.reduce((acc, button) => {
    const color = button[property];
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

export async function mapInternalLinks(page) {
  const html = await page.content();
  const $ = cheerio.load(html);
  const pageUrl = page.url();
  const origin = new URL(pageUrl).origin;
  
  // Initialize categories
  const categories = {
    about: [],
    legal: [],
    collections: [],
    products: [],
    blog: [],
    account: [],
    other: []
  };

  // Helper function to categorize a URL
  function categorizeUrl(url, text) {
    const path = url.pathname.toLowerCase();
    const search = url.search.toLowerCase();
    const textLower = text.toLowerCase();

    // Product pages (highest priority)
    if (path.includes('product') || path.includes('products') || 
        textLower.includes('product') || textLower.includes('products')) {
      return 'products';
    }

    // About pages (including contact and support)
    if (path.includes('about') || path.includes('contact') || path.includes('support') || path.includes('help') ||
        textLower.includes('about us') || textLower.includes('our story') || 
        textLower.includes('contact us') || textLower.includes('support') || textLower.includes('help')) {
      return 'about';
    }

    // Legal pages
    if (path.includes('legal') || path.includes('terms') || path.includes('privacy') || 
        textLower.includes('terms') || textLower.includes('privacy') || textLower.includes('legal')) {
      return 'legal';
    }

    // Collection pages (only if not a product)
    if (path.includes('collection') || path.includes('collections') || 
        textLower.includes('collection') || textLower.includes('collections')) {
      return 'collections';
    }

    // Blog pages
    if (path.includes('blog') || path.includes('news') || 
        textLower.includes('blog') || textLower.includes('news')) {
      return 'blog';
    }

    // Account pages
    if (path.includes('account') || path.includes('login') || path.includes('signup') || 
        textLower.includes('account') || textLower.includes('login') || textLower.includes('sign up')) {
      return 'account';
    }

    return 'other';
  }

  // Find all links
  const links = $('a[href]').toArray();
  const processedUrls = new Set(); // To avoid duplicates

  links.forEach(link => {
    const $link = $(link);
    const href = $link.attr('href');
    const text = $link.text().trim();
    
    try {
      const url = new URL(href, origin);
      
      // Only process internal links and avoid duplicates
      if (url.origin === origin && !processedUrls.has(url.href)) {
        processedUrls.add(url.href);
        
        const category = categorizeUrl(url, text);
        categories[category].push({
          url: url.href,
          path: url.pathname
        });
      }
    } catch (e) {
      // Skip invalid URLs
      console.warn(`Invalid URL: ${href}`);
    }
  });

  // Sort each category by path
  Object.keys(categories).forEach(category => {
    categories[category].sort((a, b) => a.path.localeCompare(b.path));
  });

  // Log the results
  //console.log('Internal Links Map:');
  //console.log(JSON.stringify(categories, null, 2));

  return categories;
}

export async function scrapeButtonColors(page) {
  const origin = new URL(page.url()).origin;

  const buttons = await page.$$eval(
    'a[href]',
    (els, origin) => {
      // Helper function to convert RGB to hex
      const rgbToHex = (rgb) => {
        // Handle rgb(r, g, b) format
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        }
        // If it's already hex or another format, return as is
        return rgb;
      };

      return els
        .filter(el => {
          const tag = el.tagName.toLowerCase();

          // For anchor tags, only include those with button-related classes
          const classes = (el.getAttribute('class') || '').toLowerCase();
          if (!classes.includes('button')) {
            return false;
          }

          // Only include hrefs containing 'product' or 'collection'
          const href = (el.getAttribute('href') || '').toLowerCase();
          if (!href.includes('product') && !href.includes('collection')) {
            return false;
          }

          // Skip elements within header
          const headerAncestors = ['header', 'nav', '.header', '#header', '[role="banner"]'];
          if (headerAncestors.some(selector => el.closest(selector))) {
            return false;
          }

          // Skip elements within footer
          const footerAncestors = ['footer', '.footer', '#footer', '[role="contentinfo"]'];
          if (footerAncestors.some(selector => el.closest(selector))) {
            return false;
          }

          // 1) exclude <button type="submit">
          if (tag === 'button') {
            const type = (el.getAttribute('type') || 'button').toLowerCase();
            if (type === 'submit') return false;
          }

          // 2) for <a>, only same‐origin hrefs
          if (tag === 'a') {
            const href = el.getAttribute('href') || '';
            let url;
            try {
              url = new URL(href, origin);
            } catch {
              return false;
            }
            if (url.origin !== origin) return false;
          }

          return true;
        })
        .map(el => {
          // compute "collection" boost
          const attrsToCheck = ['class','id','name','href','title','alt'];
          const haystack = attrsToCheck
            .map(name => (el.getAttribute(name) || ''))
            .join(' ')
            .toLowerCase();
          const score = haystack.includes('collection') ? 1 : 0;

          // grab computed styles
          const styles = window.getComputedStyle(el);
          return {
            tag:     el.tagName.toLowerCase(),
            text:    el.innerText.trim().slice(0,50),
            href:    el.href || null,
            background: rgbToHex(styles.backgroundColor),
            color:      rgbToHex(styles.color),
            score
          };
        })
        // 3) sort: "collection" first
        .sort((a, b) => b.score - a.score);
    },
    origin
  );

  if (buttons.length === 0) {
    const geminiColors = await analyzeButtonColorsFromScreenshot(page);
    return {
      buttons: [],
      mostCommonBackground: geminiColors.buttonBackgroundColor || "#000000",
      mostCommonTextColor: geminiColors.buttonTextColor || "#FFFFFF"
    };
  }

  const mostCommonBackground = findMostCommonColor(buttons, 'background');
  const mostCommonTextColor = findMostCommonColor(buttons, 'color');

  return {
    buttons,
    mostCommonBackground,
    mostCommonTextColor
  };
}

export async function scrapeLogo(page) {
  const html = await page.content();
  const pageUrl = page.url();
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;

  // 1) Locate header section
  const header = $('[id*=header], header').first();
  if (!header.length) return null;

  // 2) Collect all images inside header
  const imgs = header.find('img').toArray().map(el => $(el));

  // 3) Prioritize imgs whose any attribute contains 'logo'
  const logoImgs = imgs.filter($img => {
    const attrs = [
      $img.attr('id'),
      $img.attr('class'),
      $img.attr('alt'),
      $img.attr('title'),
      $img.attr('src')
    ].filter(Boolean);

    return attrs.some(val => /logo/i.test(val));
  });

  // 4) Pick the first 'logo'-matched img, else the first img at all
  const chosen = logoImgs.length ? logoImgs[0] : imgs[0];
  if (!chosen) return null;

  // 5) Extract a usable URL from src, data-src, or srcset
  let src = chosen.attr('src') || chosen.attr('data-src') || chosen.attr('srcset') || '';
  // if srcset, take first URL before a space
  if (src.includes(' ')) src = src.split(' ')[0];

  // 6) Extract width and height attributes (if present)
  let width = chosen.attr('width') || null;
  let height = chosen.attr('height') || null;

  // 7) If width or height is not present, check computed style in browser context
  if (!width || !height) {
    // Try to find the selector for the chosen image
    let selector = null;
    if (chosen.attr('id')) {
      selector = `#${chosen.attr('id')}`;
    } else if (chosen.attr('class')) {
      selector = `img.${chosen.attr('class').split(' ').join('.')}`;
    } else if (src) {
      selector = `img[src='${src}']`;
    }
    if (selector) {
      const computed = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { width: null, height: null };
        const rect = el.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }, selector);
      if (!width && computed.width) width = computed.width;
      if (!height && computed.height) height = computed.height;
    }
  }

  try {
    return {
      url: new URL(src, origin).href,
      width,
      height
    };
  } catch (e) {
    return null;
  }
} 