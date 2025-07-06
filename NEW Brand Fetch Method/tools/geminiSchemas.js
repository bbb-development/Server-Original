import { Type } from '@google/genai';

// Schema for best sellers URL
export const fetchURLsSchema = {
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

// Schema for product list
export const productListSchema = {
    type: Type.OBJECT,
    required: ["productsFound"],
    properties: {
      productsFound: {
        type: Type.BOOLEAN,
        description: "Whether products were found on the page"
      },
      products: {
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
              description: "The direct URL to the product page."
            },
            productPrice: {
              type: Type.STRING,
              description: "The price of the product, typically as a string (e.g., '$19.99', '£50.00')."
            },
            productImgUrl: {
              type: Type.STRING,
              description: "The URL of the product image"
            }
          }
        }
      }
    }
  };

  // Schema specifically for brand benefits with icons
export const brandBenefitsSchema = {
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
    brandIndustry: {
      type: Type.STRING,
      description: "The industry the brand operates in"
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

// Schema for deliverability snippet
export const deliverabilitySnippetSchema = {
    type: Type.OBJECT,
    required: ["deliverability_snippet"],
    properties: {
      deliverability_snippet: {
        type: Type.STRING,
        description: "The generated deliverability snippet HTML block"
      }
    }
  };

// Schema for client matching response
export const matchClientSchema = {
  type: Type.OBJECT,
  required: ["found", "confidence", "matchReason"],
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "Whether a matching client was found"
    },
    klaviyoClientId: {
      type: Type.STRING,
      description: "The Klaviyo client ID of the matched client (company_id field from Klaviyo data). Required when found is true, empty string when found is false."
    },
    supabaseId: {
      type: Type.STRING,
      description: "The Supabase ID of the matched client. Required when found is true, empty string when found is false."
    },
    confidence: {
      type: Type.STRING,
      enum: ["high", "medium", "low"],
      description: "The confidence level of the match"
    },
    matchReason: {
      type: Type.STRING,
      description: "Brief explanation of why this match was selected or why no match was found"
    }
  }
};