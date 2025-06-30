/**
 * Brandfetch API Integration
 * Combines all Brandfetch services: Brand Search API, Brand API, Logo Link
 * 
 * Documentation:
 * - Brand Search API: https://docs.brandfetch.com/docs/brand-search-api
 * - Brand API: https://docs.brandfetch.com/docs/brand-api
 * - Logo Link: https://docs.brandfetch.com/docs/logo-link
 */

import config from '../config.js';

class BrandfetchAPI {
  constructor(options = {}) {
    this.clientId = options.clientId || config.brandfetch?.clientId || process.env.BRANDFETCH_CLIENT_ID;
    this.apiKey = options.apiKey || config.brandfetch?.apiKey || process.env.BRANDFETCH_API_KEY;
    this.baseUrl = 'https://api.brandfetch.io/v2';
    this.cdnUrl = 'https://cdn.brandfetch.io';
  }

  /**
   * Brand Search API - Search for brands by name (FREE)
   * Rate limit: 500k requests/month, 200 requests per 5 minutes
   * @param {string} query - Brand name to search for
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results with brand matches
   */
  async searchBrands(query, options = {}) {
    if (!this.clientId) {
      throw new Error('Client ID is required for Brand Search API. Get one from https://www.brandfetch.com/developers');
    }

    const url = new URL(`${this.baseUrl}/search/${encodeURIComponent(query)}`);
    url.searchParams.append('c', this.clientId);
    
    if (options.limit) url.searchParams.append('limit', options.limit);

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brand Search API error (${response.status}): ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Brand Search API request failed: ${error.message}`);
    }
  }

  /**
   * Brand API - Get comprehensive brand data (PAID)
   * Includes logos, colors, fonts, images, and firmographic info
   * @param {string} domain - Website domain (e.g., 'nike.com')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Complete brand information
   */
  async getBrandData(domain, options = {}) {
    if (!this.apiKey) {
      throw new Error('API Key is required for Brand API. Get one from https://www.brandfetch.com/developers');
    }

    // Clean domain (remove protocol, www, etc.)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    const url = `${this.baseUrl}/brands/${encodeURIComponent(cleanDomain)}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brand API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      // Check usage headers
      const quota = response.headers.get('x-api-key-quota');
      const usage = response.headers.get('x-api-key-approximate-usage');
      
      if (quota && usage) {
        console.log(`📊 Brand Fetch: API Usage: ${usage}/${quota} requests this month`);
      }

      return data;
    } catch (error) {
      throw new Error(`Brand API request failed: ${error.message}`);
    }
  }

  /**
   * Logo Link - Generate CDN URL for brand logo (FREE)
   * @param {string} domain - Website domain
   * @param {Object} options - Logo customization options
   * @param {number} options.size - Logo size (height in pixels)
   * @param {string} options.theme - 'light' or 'dark'
   * @param {string} options.format - Logo format/type
   * @returns {string} CDN URL for the logo
   */
  getLogoUrl(domain, options = {}) {
    if (!this.clientId) {
      throw new Error('Client ID is required for Logo Link. Get one from https://www.brandfetch.com/developers');
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    const url = new URL(`${this.cdnUrl}/${encodeURIComponent(cleanDomain)}`);
    url.searchParams.append('c', this.clientId);
    
    if (options.size) url.searchParams.append('size', options.size);
    if (options.theme) url.searchParams.append('theme', options.theme);
    if (options.format) url.searchParams.append('format', options.format);

    return url.toString();
  }

  /**
   * Search for a brand and get its complete data
   * Combines Brand Search API + Brand API
   * @param {string} brandName - Name of the brand to search for
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Complete brand data for the best match
   */
  async searchAndGetBrandData(brandName, options = {}) {
    try {
      // First, search for the brand to get its domain
      const searchResults = await this.searchBrands(brandName, { limit: 1 });
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error(`No brands found matching "${brandName}"`);
      }

      const bestMatch = searchResults[0];
      console.log(`Found brand: ${bestMatch.name} (${bestMatch.domain})`);

      // Then get complete brand data
      const brandData = await this.getBrandData(bestMatch.domain, options);
      
      return {
        searchResult: bestMatch,
        brandData: brandData,
        logoUrl: this.getLogoUrl(bestMatch.domain, options.logoOptions)
      };
    } catch (error) {
      throw new Error(`Combined brand search failed: ${error.message}`);
    }
  }

  /**
   * Get multiple logo URLs for different themes/sizes
   * @param {string} domain - Website domain
   * @param {Object} options - Options for logo variations
   * @returns {Object} Object with different logo URL variations
   */
  getLogoVariations(domain, options = {}) {
    const variations = {
      default: this.getLogoUrl(domain),
      light: this.getLogoUrl(domain, { theme: 'light' }),
      dark: this.getLogoUrl(domain, { theme: 'dark' })
    };

    if (options.sizes) {
      options.sizes.forEach(size => {
        variations[`size_${size}`] = this.getLogoUrl(domain, { size });
        variations[`light_${size}`] = this.getLogoUrl(domain, { theme: 'light', size });
        variations[`dark_${size}`] = this.getLogoUrl(domain, { theme: 'dark', size });
      });
    }

    return variations;
  }

  /**
   * Extract key brand colors from brand data
   * @param {Object} brandData - Brand data from getBrandData()
   * @returns {Object} Organized color information
   */
  extractBrandColors(brandData) {
    if (!brandData.colors || brandData.colors.length === 0) {
      return { primary: null, secondary: null, all: [] };
    }

    const colors = brandData.colors.map(colorObj => ({
      hex: colorObj.hex,
      type: colorObj.type,
      brightness: colorObj.brightness
    }));

    return {
      primary: colors[0]?.hex || null,
      secondary: colors[1]?.hex || null,
      all: colors
    };
  }

  /**
   * Get brand summary with essential information
   * @param {string} domain - Website domain
   * @returns {Promise<Object>} Essential brand information
   */
  async getBrandSummary(domain) {
    try {
      const brandData = await this.getBrandData(domain);

      // Filter out fonts with variable names (like "var(--font-heading-family)")
      const validFonts = brandData.fonts ? brandData.fonts.filter(font => 
        !font.name.startsWith('var(')
      ) : [];

      return {
        name: brandData.name,
        domain: brandData.domain,
        links: brandData.links,
        logos: brandData.logos,
        colors: brandData.colors,
        fonts: validFonts
      };
    } catch (error) {
      throw new Error(`Failed to get brand summary: ${error.message}`);
    }
  }

  /**
   * Check API usage and quota using free test domain
   * Uses brandfetch.com domain which is free and doesn't count towards quota
   * @returns {Promise<Object>} Usage information from headers
   */
  async getBrandfetchUsage() {
    try {
      //console.log('🔍 Checking Brandfetch usage via free test domain...');
      
      // Use the existing getBrandData method with free domain
      await this.getBrandData('brandfetch.com');
      
      // The usage info is already logged by getBrandData, 
      // but we can't return it since it's not exposed
      // This is mainly for triggering the usage display
      return { message: 'Usage info displayed in console logs above' };

    } catch (error) {
      console.warn('⚠️ Could not fetch Brandfetch usage info:', error.message);
      return null;
    }
  }
}

// Export both the class and a default instance
export { BrandfetchAPI };

// Create default instance
const brandfetch = new BrandfetchAPI();
export default brandfetch;

// Export individual methods for convenience
export const searchBrands = (query, options) => brandfetch.searchBrands(query, options);
export const getBrandData = (domain, options) => brandfetch.getBrandData(domain, options);
export const getLogoUrl = (domain, options) => brandfetch.getLogoUrl(domain, options);
export const searchAndGetBrandData = (brandName, options) => brandfetch.searchAndGetBrandData(brandName, options);
export const getBrandSummary = (domain) => brandfetch.getBrandSummary(domain);
export const getBrandfetchUsage = () => brandfetch.getBrandfetchUsage(); 