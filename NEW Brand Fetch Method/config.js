import dotenv from 'dotenv';

dotenv.config();

const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash-lite-preview-06-17',
    defaultConfig: {
      thinkingConfig: {
        thinkingBudget: 0,
      },
      tools: [
        { urlContext: {} },
      ],
      responseMimeType: 'text/plain',
    }
  },
  brandfetch: {
    // Brand Search API and Logo Link
    clientId: process.env.BRANDFETCH_CLIENT_ID,
    apiKey: process.env.BRANDFETCH_API_KEY,
  },
  firecrawl: {
    // Firecrawl API for web scraping and mapping
    apiKey: process.env.FIRECRAWL_API_KEY,
  }
};

export default config;
