// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';
import geminiConfig from '../config.js';

export async function askGemini(prompt, schema) {
  const ai = new GoogleGenAI({
    apiKey: geminiConfig.gemini.apiKey,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: 0,
    },
    responseMimeType: 'application/json',
    responseSchema: schema,
  };
  const model = geminiConfig.gemini.model;
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  
  // Log only the text from the response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  return text;
}

//askGemini();
