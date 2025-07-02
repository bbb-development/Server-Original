/**
 * Firecrawl API Integration
 * Provides functions for web scraping and mapping using Firecrawl API
 * 
 * Documentation: https://docs.firecrawl.dev/
 * API Reference: https://api.firecrawl.dev/
 */

import config from '../config.js';

class FirecrawlAPI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || config.firecrawl?.apiKey || process.env.FIRECRAWL_API_KEY;
    this.baseUrl = 'https://api.firecrawl.dev/v1';

    //console.log('Firecrawl API Key:', this.apiKey);
    
    if (!this.apiKey) {
      throw new Error('Firecrawl API key is required. Get one from https://firecrawl.dev/');
    }
  }

  /**
   * Common headers for all requests
   */
  get headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * Scrape a single URL and extract content
   * @param {string} url - The URL to scrape
   * @param {Object} options - Scraping options
   * @param {Array} options.formats - Output formats ['markdown', 'html', 'rawHtml', 'links', 'screenshot', 'extract']
   * @param {Array} options.includeTags - HTML tags to include (e.g., ['p', 'h1', 'h2'])
   * @param {Array} options.excludeTags - HTML tags to exclude (e.g., ['nav', 'footer'])
   * @param {boolean} options.onlyMainContent - Extract only main content (default: true)
   * @param {Array} options.actions - Actions to perform before scraping
   * @param {Object} options.extract - Schema for structured extraction
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<Object>} Scraped content and metadata
   */
  async scrape(url, options = {}) {
    try {
      const payload = {
        url,
        formats: options.formats || ['markdown'],
        ...this._buildScrapeParams(options)
      };

      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firecrawl scrape error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      throw new Error(`Scrape request failed: ${error.message}`);
    }
  }

  /**
   * Map/discover all URLs on a website
   * @param {string} url - The base URL to map
   * @param {Object} options - Mapping options
   * @param {string} options.search - Search filter for URLs
   * @param {boolean} options.sitemapOnly - Use only sitemap for discovery
   * @param {boolean} options.includeSubdomains - Include subdomain URLs
   * @param {number} options.limit - Maximum number of URLs to return (default: 5000)
   * @param {boolean} options.useIndex - Use cached index if available
   * @returns {Promise<Object>} Object containing success status and links array
   */
  async map(url, options = {}) {
    try {
      const payload = {
        url,
        search: options.search,
        sitemapOnly: options.sitemapOnly,
        includeSubdomains: options.includeSubdomains,
        limit: options.limit || 5000,
        useIndex: options.useIndex !== false // Default to true
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => 
        payload[key] === undefined && delete payload[key]
      );

      const response = await fetch(`${this.baseUrl}/map`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firecrawl map error (${response.status}): ${errorData}`);
      }

      // Check for usage headers
      this._logUsageInfo(response.headers, 'Map');

      return await response.json();
    } catch (error) {
      throw new Error(`Map request failed: ${error.message}`);
    }
  }

  /**
   * Batch scrape multiple URLs
   * @param {Array<string>} urls - Array of URLs to scrape
   * @param {Object} options - Scraping options (same as scrape method)
   * @returns {Promise<Object>} Batch job information
   */
  async batchScrape(urls, options = {}) {
    try {
      const payload = {
        urls,
        formats: options.formats || ['markdown'],
        ...this._buildScrapeParams(options)
      };

      const response = await fetch(`${this.baseUrl}/batch/scrape`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firecrawl batch scrape error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Batch scrape request failed: ${error.message}`);
    }
  }

  /**
   * Check the status of a batch scrape job
   * @param {string} jobId - The batch job ID
   * @returns {Promise<Object>} Job status and results
   */
  async checkBatchStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/batch/scrape/${jobId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firecrawl batch status error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Batch status check failed: ${error.message}`);
    }
  }

  /**
   * Scrape with structured data extraction using AI
   * @param {string} url - URL to scrape
   * @param {Object} schema - JSON schema for extraction
   * @param {string} prompt - Extraction prompt for the AI
   * @param {string} systemPrompt - System prompt for the AI
   * @returns {Promise<Object>} Extracted structured data
   */
  async extract(url, schema, prompt, systemPrompt = null) {
    const options = {
      formats: ['extract'],
      extract: {
        schema,
        prompt,
        ...(systemPrompt && { systemPrompt })
      }
    };

    return await this.scrape(url, options);
  }

  /**
   * Scrape with page interactions (clicks, typing, etc.)
   * @param {string} url - URL to scrape
   * @param {Array} actions - Array of actions to perform
   * @param {Object} options - Additional scraping options
   * @returns {Promise<Object>} Scraped content after interactions
   */
  async scrapeWithActions(url, actions, options = {}) {
    return await this.scrape(url, {
      ...options,
      actions
    });
  }

  /**
   * Take a screenshot of a webpage
   * @param {string} url - URL to screenshot
   * @param {boolean} fullPage - Take full page screenshot (default: false)
   * @param {Array} actions - Actions to perform before screenshot
   * @returns {Promise<Object>} Screenshot data
   */
  async screenshot(url, fullPage = false, actions = []) {
    const format = fullPage ? 'screenshot@fullPage' : 'screenshot';
    return await this.scrape(url, {
      formats: [format],
      ...(actions.length > 0 && { actions })
    });
  }

  /**
   * Get all links from a webpage
   * @param {string} url - URL to extract links from
   * @returns {Promise<Array>} Array of links
   */
  async getLinks(url) {
    const result = await this.scrape(url, { formats: ['links'] });
    return result.links || [];
  }

  /**
   * Scrape and convert to clean markdown
   * @param {string} url - URL to scrape
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Clean markdown content
   */
  async toMarkdown(url, options = {}) {
    const result = await this.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      ...options
    });
    return result.markdown || result.content || '';
  }

  /**
   * Build scrape parameters from options
   * @private
   */
  _buildScrapeParams(options) {
    const params = {};

    // Page options - these go at the top level in v1 API
    if (options.includeTags) params.includeTags = options.includeTags;
    if (options.excludeTags) params.excludeTags = options.excludeTags;
    if (options.onlyMainContent !== undefined) params.onlyMainContent = options.onlyMainContent;

    // Actions
    if (options.actions) params.actions = options.actions;

    // Extraction
    if (options.extract) params.extract = options.extract;

    // Timeout
    if (options.timeout) params.timeout = options.timeout;

    return params;
  }

  /**
   * Helper to create common actions
   */
  static createActions() {
    return {
      wait: (milliseconds) => ({ type: 'wait', milliseconds }),
      click: (selector) => ({ type: 'click', selector }),
      write: (text) => ({ type: 'write', text }),
      press: (key) => ({ type: 'press', key }),
      screenshot: () => ({ type: 'screenshot' })
    };
  }

  /**
   * Check account usage and credits
   * @returns {Promise<Object>} Usage information
   */
  async getFirecrawlUsage() {
    try {
      const response = await fetch(`${this.baseUrl}/team/credit-usage`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firecrawl usage error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      //console.log('Firecrawl Usage:', data);
      console.log('📊 Remaining Firecrawl Credits:', data?.data?.remaining_credits || 'Unknown');
      return data;
    } catch (error) {
      console.warn('⚠️ Could not fetch Firecrawl usage info:', error.message);
      return null;
    }
  }

  /**
   * Log usage information from response headers
   * @private
   */
  _logUsageInfo(headers, operation = 'Operation') {
    // Common header names that APIs use for rate limiting/usage
    const usageHeaders = [
      'x-ratelimit-remaining',
      'x-ratelimit-limit', 
      'x-credits-remaining',
      'x-credits-used',
      'x-usage-remaining',
      'x-quota-remaining',
      'x-firecrawl-credits',
      'x-firecrawl-usage'
    ];

    const usageInfo = {};
    usageHeaders.forEach(header => {
      const value = headers.get(header);
      if (value) {
        usageInfo[header] = value;
      }
    });

    if (Object.keys(usageInfo).length > 0) {
      console.log(`💳 Firecrawl ${operation} Usage:`, usageInfo);
    }
  }
}

// Export the class and create a default instance
export { FirecrawlAPI };

// Create default instance
const firecrawl = new FirecrawlAPI();
export default firecrawl;

// Export convenient methods
export const scrape = (url, options) => firecrawl.scrape(url, options);
export const map = (url, options) => firecrawl.map(url, options);
export const batchScrape = (urls, options) => firecrawl.batchScrape(urls, options);
export const extract = (url, schema, prompt, systemPrompt) => firecrawl.extract(url, schema, prompt, systemPrompt);
export const screenshot = (url, fullPage, actions) => firecrawl.screenshot(url, fullPage, actions);
export const getLinks = (url) => firecrawl.getLinks(url);
export const toMarkdown = (url, options) => firecrawl.toMarkdown(url, options);
export const getFirecrawlUsage = () => firecrawl.getFirecrawlUsage();

getFirecrawlUsage();