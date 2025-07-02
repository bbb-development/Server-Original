// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
    GoogleGenAI
  } from '@google/genai';
import config from '../config.js';

/**
 * Generate content using Google's Gemini AI
 * @param {string} inputText - The text prompt to send to Gemini
 * @param {Object} options - Optional configuration overrides
 * @param {Object} schema - Optional JSON schema for structured output
 * @returns {Promise<string>} - The generated response text
 */
export async function askGemini(inputText, options = {}, schema = null) {
  try {
    const ai = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
    });

    // Merge default config with any provided options
    const finalConfig = {
      ...config.gemini.defaultConfig,
      responseMimeType: schema ? 'application/json' : config.gemini.defaultConfig.responseMimeType,
      ...options
    };

    // Add schema if provided
    if (schema) {
      finalConfig.responseSchema = schema;
    }

    const model = options.model || config.gemini.model;
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: inputText,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config: finalConfig,
      contents,
    });

    let fullResponse = '';
    for await (const chunk of response) {
      fullResponse += chunk.text;
    }

    //console.log(JSON.stringify(fullResponse, null, 2));

    return fullResponse;
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}