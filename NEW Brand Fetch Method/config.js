import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory (server-scraper/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  gemini: {
    // API and Model for Gemini
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash-preview-04-17',
  },
  brandfetch: {
    // Brand Search API and Logo Link
    clientId: process.env.BRANDFETCH_CLIENT_ID,
    apiKey: process.env.BRANDFETCH_API_KEY,
  },
  firecrawl: {
    // Firecrawl API for web scraping and mapping
    apiKey: process.env.FIRECRAWL_API_KEY,
  },
  browserless: {
    // Browserless API for web scraping with headless browser
    apiKey: process.env.BROWSERLESS_API_KEY,
  }
};

export default config;
