import { getRandomImageFromAlbum } from "../../Functions/imgBB Integration.js";
import { womanNames } from "../../Functions/woman_names.js";

export async function generateTemplate(data) {
  const images = await getRandomImageFromAlbum("nMcy6V", "AC Email #4", 1);
  const randomName = womanNames[Math.floor(Math.random() * womanNames.length)];
  return (
    {
      "root": {
        "type": "EmailLayout",
    "data": {
      "backdropColor": "#1E1E1E",
      "canvasColor": "#FFFFFF",
      "textColor": "#262626",
      "fontFamily": "MODERN_SANS",
      "childrenIds": [
        "block-1745496607746",
        "block-1745496672951",
        "block-1745496895310",
        "block-1745496927339",
        "block-1745497150108"
      ]
    }
  },
  "block-1745496607746": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "ORGANIC_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 28,
          "bottom": 8,
          "right": 28,
          "left": 28
        }
      },
      "props": {
        "text": "Hi {{ first_name|default:'there' }},"
      }
    }
  },
  "block-1745496672951": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "ORGANIC_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 8,
          "bottom": 8,
          "right": 28,
          "left": 28
        }
      },
      "props": {
        "text": "\n\nI noticed your discount code recently expired, and I just wanted to check in. Were there any issues checking out? If so, let me know—I’d be happy to help!\n"
      }
    }
  },
  "block-1745496895310": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "ORGANIC_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 8,
          "bottom": 8,
          "right": 28,
          "left": 28
        }
      },
      "props": {
        "text": "\nIf the timing wasn’t right, no worries at all. We’d love for you to stay connected and continue taking part in our social initiatives.\n"
      }
    }
  },
  "block-1745496927339": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "ORGANIC_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 8,
          "bottom": 8,
          "right": 28,
          "left": 28
        }
      },
      "props": {
        "text": "Best,"
      }
    }
  },
  "block-1745497150108": {
    "type": "ColumnsContainer",
    "data": {
      "style": {
        "padding": {
          "top": 28,
          "bottom": 28,
          "right": 28,
          "left": 28
        }
      },
      "props": {
        "fixedWidths": [
          100,
          null,
          null
        ],
        "columnsCount": 2,
        "columnsGap": 24,
        "columns": [
          {
            "childrenIds": [
              "block-1745497167376"
            ]
          },
          {
            "childrenIds": [
              "block-1745497196847",
              "block-1745497247022",
              "block-1745663029314"
            ]
          },
          {
            "childrenIds": []
          }
        ]
      }
    }
  },
  "block-1745497167376": {
    "type": "Image",
    "data": {
      "style": {
        "padding": {
          "top": 0,
          "bottom": 0,
          "right": 0,
          "left": 0
        }
      },
      "props": {
        "width": 100,
        "height": 100,
        "url": images[0].directLink,
        "alt": randomName,
        "linkHref": data.brand.url,
        "contentAlignment": "middle"
      }
    }
  },
  "block-1745497196847": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 20,
        "fontFamily": "BOOK_SANS",
        "fontWeight": "bold",
        "padding": {
          "top": 0,
          "bottom": 4,
          "right": 0,
          "left": 0
        }
      },
      "props": {
        "text": randomName
      }
    }
  },
  "block-1745497247022": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "BOOK_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 0,
          "bottom": 0,
          "right": 0,
          "left": 0
        }
      },
      "props": {
        "text": "Customer Success Assistant"
      }
    }
  },
  "block-1745663029314": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 16,
        "fontFamily": "ORGANIC_SANS",
        "fontWeight": "normal",
        "padding": {
          "top": 0,
          "bottom": 0,
          "right": 0,
          "left": 0
        }
      },
      "props": {
        "text": data.brand.url // make Klaviyo {{ organization.url }}
      }
    }
  }
}
);
}

export default generateTemplate;