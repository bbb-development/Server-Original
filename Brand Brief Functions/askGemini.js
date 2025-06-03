import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { GEMINI_MODEL, GEMINI_API_KEY } from './config.js';

async function loadImageAsBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}

async function loadMultipleImagesAsBase64(imagePaths) {
  try {
    const base64Promises = imagePaths.map(loadImageAsBase64);
    return await Promise.all(base64Promises);
  } catch (error) {
    console.error('Error loading images:', error);
    throw error;
  }
}

export async function askGemini(text, imagePaths = null, schema = null) {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  const config = {
    responseMimeType: schema ? 'application/json' : 'text/plain',
  };

  // Add schema if provided
  if (schema) {
    config.responseSchema = schema;
  }

  const model = GEMINI_MODEL;
  
  // Prepare the parts array with text
  const parts = [{ text }];
  
  // Add images if provided
  if (imagePaths) {
    // Convert single path to array if needed
    const pathsArray = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
    
    // Convert all images to base64
    const base64Images = await loadMultipleImagesAsBase64(pathsArray);
    
    // Add each base64 image to parts
    base64Images.forEach(base64Image => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      });
    });
  }

  const contents = [
    {
      role: 'user',
      parts
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });

  return response.text;
}

// Example schema for brand brief
export const brandBriefSchema = {
  type: Type.OBJECT,
  required: ["brandName", "brandDescription", "brandAudience", "brandTone", "brandMessage", "topEmailText", "aboutUs"],
  properties: {
    brandName: {
      type: Type.STRING,
      description: "The name of the brand"
    },
    brandDescription: {
      type: Type.STRING,
      description: "Description of the brand"
    },
    brandAudience: {
      type: Type.STRING,
      description: "Target audience description"
    },
    brandTone: {
      type: Type.STRING,
      description: "Brand tone of voice"
    },
    brandMessage: {
      type: Type.STRING,
      description: "Core brand message"
    },
    topEmailText: {
      type: Type.STRING,
      description: "A short text line for the email header that makes sense regardless of season/month"
    },
    aboutUs: {
      type: Type.OBJECT,
      description: "Three flowing paragraphs that tell the brand's story",
      required: ["paragraph1", "paragraph2", "paragraph3"],
      properties: {
        paragraph1: {
          type: Type.STRING,
          description: "First paragraph starting with 'At [Brand Name], we...'"
        },
        paragraph2: {
          type: Type.STRING,
          description: "Second paragraph mentioning the best-seller and how it matches the first paragraph"
        },
        paragraph3: {
          type: Type.STRING,
          description: "Third paragraph flowing into the brand mission starting with 'That all ties into our mission to...'"
        },
      },
    },
  },
};

// Schema specifically for brand benefits with icons
export const brandBenefitsWithIconsSchema = {
  type: Type.OBJECT,
  required: ["brandBenefits"],
  properties: {
    brandBenefits: {
      type: Type.ARRAY,
      description: "List of benefits with matching icons",
      items: {
        type: Type.OBJECT,
        required: ["title", "description", "DirectLink"],
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the brand benefit."
          },
          description: {
            type: Type.STRING,
            description: "A detailed description of the benefit."
          },
          DirectLink: {
            type: Type.STRING,
            description: "Direct URL to the icon that represents this benefit."
          }
        },
      },
    }
  }
};

// Schema for button colors
export const buttonColorsSchema = {
  type: Type.OBJECT,
  required: ["buttonBackgroundColor", "buttonTextColor"],
  properties: {
    buttonBackgroundColor: {
      type: Type.STRING,
      description: "The background color of the button in hex format (e.g., '#FF5733')"
    },
    buttonTextColor: {
      type: Type.STRING,
      description: "The text color of the button in hex format (e.g., '#FFFFFF')"
    }
  }
};

// Schema for product list
export const productListSchema = {
  type: Type.ARRAY,
  minItems: 9,
  maxItems: 9,
  items: {
    type: Type.OBJECT,
    required: ["productName", "productURL", "productPrice", "productImgUrl"],
    properties: {
      productName: {
        type: Type.STRING,
        description: "The name of the product"
      },
      productURL: {
        type: Type.STRING,
        description: "The URL where the product can be found"
      },
      productPrice: {
        type: Type.STRING,
        description: "The price of the product"
      },
      productImgUrl: {
        type: Type.STRING,
        description: "The URL of the product image"
      }
    }
  }
};

// Schema for best sellers URL
export const bestSellersSchema = {
  type: Type.OBJECT,
  required: ["bestSellersUrl", "contactUrl", "faqUrl"],
  properties: {
    bestSellersUrl: {
      type: Type.STRING,
      description: "The URL to the best sellers collection"
    },
    contactUrl: {
      type: Type.STRING,
      description: "The URL to the contact us page"
    },
    faqUrl: {
      type: Type.STRING,
      description: "The URL to the FAQ or help/support page"
    }
  }
};

async function exampleUsage() {
  const example = 'productList';

  if (example === 'text') {
    // Text only:
    await askGemini("heyooo, whasup?")
      .then(console.log)
      .catch(console.error);
  } else if (example === 'images') {
    // Example usage with multiple local images:
    const imagePaths = [
      path.join(process.cwd(), 'Frame 6.png'),
      path.join(process.cwd(), 'viber_image_2025-04-03_22-46-44-183.jpg'),
    ];

    await askGemini("describe these images", imagePaths)
      .then(console.log)
      .catch(console.error);
  } else if (example === 'brandBrief') {
    // Example usage with structured output
    await askGemini("Create a brand brief for a sustainable fashion brand", null, brandBriefSchema)
      .then(response => {
        try {
          const parsedResponse = JSON.parse(response);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log(response);
        }
      })
      .catch(console.error);
  } else if (example === 'buttonColors') {
    // Example usage for button colors
    await askGemini("Based on this brand image, suggest button colors that would match the brand's aesthetic", null, buttonColorsSchema)
      .then(response => {
        try {
          const parsedResponse = JSON.parse(response);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log(response);
        }
      })
      .catch(console.error);
  } else if (example === 'productList') {
    // Example usage for product list
    await askGemini("Generate a list of 5 sustainable fashion products that would match this brand's aesthetic", null, productListSchema)
      .then(response => {
        try {
          const parsedResponse = JSON.parse(response);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log(response);
        }
      })
      .catch(console.error);
  } else if (example === 'bestSellers') {
    // Example usage for best sellers URL
    await askGemini("Generate a URL for the best sellers collection", null, bestSellersSchema)
      .then(response => {
        try {
          const parsedResponse = JSON.parse(response);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log(response);
        }
      })
      .catch(console.error);
  }
}

//exampleUsage();