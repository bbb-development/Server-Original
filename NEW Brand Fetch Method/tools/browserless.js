/**
 * Browserless API Integration
 * Provides functions for web scraping using Browserless headless browser service
 * 
 * Documentation: https://docs.browserless.io/
 */

import config from '../config.js';
import TurndownService from 'turndown';
const useProxy = true;

class BrowserlessAPI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || config.browserless?.apiKey || process.env.BROWSERLESS_API_KEY;
    this.baseUrl = 'https://production-sfo.browserless.io';
    this.useProxy = options.useProxy !== undefined ? options.useProxy : useProxy;
    console.log(`🔧 Browserless initialized ${this.useProxy ? 'using' : 'not using'} proxies`);
    
    if (!this.apiKey) {
      throw new Error('Browserless API key is required. Get one from https://browserless.io/');
    }
  }

  /**
   * Common headers for all requests
   */
  get headers() {
    return {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json"
    };
  }

  /**
   * Build endpoint URL with proxy parameters if enabled
   * @param {string} endpoint - The API endpoint (e.g., 'content', 'pdf', 'screenshot')
   * @param {Object} options - Configuration options
   * @param {Object} options.proxy - Proxy configuration options
   * @param {boolean} options.proxy.useProxy - Whether to use proxy (overrides default)
   * @param {string} options.proxy.proxyCountry - ISO 3166 country code (e.g., 'us', 'uk', 'de')
   * @param {boolean} options.proxy.proxySticky - Maintain same proxy IP across session
   * @param {number} options.timeout - Request timeout in milliseconds (default: 50000)
   * @returns {string} Complete endpoint URL with proxy and timeout parameters
   */
  _buildEndpointUrl(endpoint = 'content', options = {}) {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append('token', this.apiKey);

    // Add timeout parameter (default to 50 seconds)
    const timeout = options.timeout || 50000;
    url.searchParams.append('timeout', timeout.toString());

    const proxyOptions = options.proxy || {};
    const shouldUseProxy = proxyOptions.useProxy !== undefined ? proxyOptions.useProxy : this.useProxy;

    if (shouldUseProxy) {
      url.searchParams.append('proxy', 'residential');
      
      if (proxyOptions.proxyCountry) {
        url.searchParams.append('proxyCountry', proxyOptions.proxyCountry);
      }
      
      if (proxyOptions.proxySticky) {
        url.searchParams.append('proxySticky', 'true');
      }
    }

    return url.toString();
  }

  /**
   * Scrape a single URL and extract content as markdown
   * @param {string} url - The URL to scrape
   * @param {Object} options - Scraping options
   * @param {boolean} options.returnHtml - Return HTML content instead of markdown
   * @param {Object} options.turndownOptions - Options for markdown conversion
   * @param {Object} options.proxy - Proxy configuration options
   * @param {boolean} options.proxy.useProxy - Whether to use proxy (overrides default)
   * @param {string} options.proxy.proxyCountry - ISO 3166 country code (e.g., 'us', 'uk', 'de')
   * @param {boolean} options.proxy.proxySticky - Maintain same proxy IP across session
   * @param {number} options.timeout - Request timeout in milliseconds (default: 50000)
   * @returns {Promise<Object>} Scraped content
   */
  async scrape(url, options = {}) {
    try {
      const endpoint = this._buildEndpointUrl('content', options);
      const payload = { url };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Browserless scrape error (${response.status}): ${errorText}`);
      }

      const htmlContent = await response.text();

      // Return HTML if requested
      if (options.returnHtml) {
        return {
          success: true,
          url,
          html: htmlContent,
          contentType: 'html',
          proxyUsed: options.proxy?.useProxy !== undefined ? options.proxy.useProxy : this.useProxy,
          timeout: options.timeout || 50000
        };
      }

      // Convert HTML to Markdown using Turndown
      const turndownService = new TurndownService({
        linkStyle: 'inlined',           // Keep links inline with text
        linkReferenceStyle: 'full',     // Full reference style for links
        headingStyle: 'atx',            // Use # for headings
        codeBlockStyle: 'fenced',       // Use ``` for code blocks
        bulletListMarker: '*',          // Use * for bullet points
        ...options.turndownOptions      // Allow custom turndown options
      });
      
      const markdown = turndownService.turndown(htmlContent);

      return {
        success: true,
        url,
        markdown,
        html: htmlContent,
        contentType: 'markdown',
        proxyUsed: options.proxy?.useProxy !== undefined ? options.proxy.useProxy : this.useProxy,
        timeout: options.timeout || 50000
      };

    } catch (error) {
      return {
        success: false,
        url,
        error: error.message,
        contentType: null,
        proxyUsed: options.proxy?.useProxy !== undefined ? options.proxy.useProxy : this.useProxy,
        timeout: options.timeout || 50000
      };
    }
  }

  /**
   * Scrape and return only markdown content
   * @param {string} url - URL to scrape
   * @param {Object} options - Additional options including proxy settings
   * @returns {Promise<string>} Clean markdown content
   */
  async toMarkdown(url, options = {}) {
    const result = await this.scrape(url, options);
    return result.success ? result.markdown : '';
  }

  /**
   * Scrape and return only HTML content
   * @param {string} url - URL to scrape
   * @param {Object} options - Additional options including proxy settings
   * @returns {Promise<string>} HTML content
   */
  async toHtml(url, options = {}) {
    const result = await this.scrape(url, { ...options, returnHtml: true });
    return result.success ? result.html : '';
  }
}



// Test function (only runs when script is executed directly)
async function testBrowserless() {
  try {
    console.log('🧪 Testing Browserless API...');
    
    // Fix: Add proper protocol to URL
    const markdown = await toMarkdown('https://neonicons.com');
    
    if (markdown) {
      console.log('✅ Success! Scraped content:');
      console.log(JSON.stringify({
        success: true,
        contentLength: markdown.length,
        preview: markdown.substring(0, 200) + '...'
      }, null, 2));
    } else {
      console.log('❌ No content returned');
    }
  } catch (error) {
    console.error('❌ Error testing Browserless:', error.message);
    
    // Check for common issues
    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure to set your BROWSERLESS_API_KEY in the .env file');
      console.log('   Get an API key from: https://browserless.io/');
    }
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Check your internet connection and API key');
    }
  }
}

// Export the class and create a default instance
export { BrowserlessAPI };

// Create default instance
const browserless = new BrowserlessAPI();
export default browserless;

// Export convenient methods
export const scrape = (url, options) => browserless.scrape(url, options);
export const toMarkdown = (url, options) => browserless.toMarkdown(url, options);
export const toHtml = (url, options) => browserless.toHtml(url, options);

// Only run test if this file is executed directly
testBrowserless();