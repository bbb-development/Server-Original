import 'dotenv/config';

// Set up proxy environment variables
process.env.HTTP_PROXY = `http://${process.env.WEBSHARE_USERNAME}:${process.env.WEBSHARE_PASSWORD}@p.webshare.io:80`;
process.env.HTTPS_PROXY = `http://${process.env.WEBSHARE_USERNAME}:${process.env.WEBSHARE_PASSWORD}@p.webshare.io:80`;

export const IMAGE_API_KEY = process.env.IMAGE_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GPT_MODEL = "gpt-4.1-mini";
export const GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";

export const GPT_CONFIG = {
  temperature: 1,
  max_output_tokens: 2048,
  top_p: 1,
  store: true
}; 