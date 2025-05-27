import { getRandomImageFromAlbum } from "../../Functions/imgBB Integration.js";
import { shuffleProducts } from "../../Functions/shuffle_products.js";

export async function generateTemplate(data) {
  const images = await getRandomImageFromAlbum("RhSd3F", "WF Email #1", 1);

  // Shuffle the best sellers products to randomize their order every time
  if (data.links?.best_sellers?.products) {    
    data.links.best_sellers.products = shuffleProducts(data.links.best_sellers.products);
  } else {
    console.error('No best sellers products found in data');
  }

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
            "block-1744989744624",
            "block-1744989810112",
            "block-1744989840430",
            "block-1744989867068",
            "block-1744989981349",
            "block-1744990112916",
            "block-1745512568623",
            "block-1745017630524",
            "block-1745017974829",
            "block-1745512698059",
            "block-1745016821630",
            "block-1745513016440",
            "block-1745513106393",
            "block-1745016882790",
            "block-1745513147038",
            "block-1745018148134",
            "block-1745018653395",
            "block-1745663752541",
            "block-1745018750028",
            "block-1745018809953",
            "block-1745018885095"
          ]
        }
      },
      "block-1744989744624": {
        "type": "Text",
        "data": {
          "style": {
            "color": data.brand.colors.text,
            "backgroundColor": data.brand.colors.background,
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 8,
              "bottom": 8,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "text": 'You’re in! Enjoy 10% OFF your first order'
          }
        }
      },
      "block-1744989810112": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 16,
              "bottom": 16,
              "right": 24,
              "left": 24
            },
            "backgroundColor": null,
            "textAlign": "center"
          },
          "props": {
            "width": 150,
            "url": data.brand.logo.url,
            "alt": `${data.brand.data.brandName} Logo`,
            "linkHref": data.brand.url,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1744989840430": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 28,
              "bottom": 28,
              "right": 28,
              "left": 28
            },
            "textAlign": "center"
          },
          "props": {
            "width": 540,
            "height": null,
            "url": images[0].directLink,
            "alt": "Header",
            "linkHref": data.brand.url,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1744989867068": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 48,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 16,
              "bottom": 0,
              "right": 80,
              "left": 80
            }
          },
          "props": {
            "text": `Welcome to\n${data.brand.data.brandName}`
          }
        }
      },
      "block-1744989981349": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 28,
              "right": 80,
              "left": 80
            }
          },
          "props": {
            "text": "Here's 10% OFF to use\nwithin the next 48 hours!"
          }
        }
      },
      "block-1744990112916": {
        "type": "Button",
        "data": {
          "style": {
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 12,
              "right": 80,
              "left": 80
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "SAVE 10% OFF",
            "url": data.brand.url
          }
        }
      },
      "block-1745512568623": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#777777",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 28,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": "Code: {% coupon_code 'WELCOME10' %}"
          }
        }
      },
      "block-1745017630524": {
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
            "columnsCount": 2,
            "columnsGap": 16,
            "columns": [
              {
                "childrenIds": [
                  "block-1745017637589",
                  "block-1745017661625",
                  "block-1745017677287"
                ]
              },
              {
                "childrenIds": [
                  "block-1745017785844",
                  "block-1745017808465",
                  "block-1745017863341"
                ]
              },
              {
                "childrenIds": []
              }
            ]
          }
        }
      },
      "block-1745017637589": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            },
            "backgroundColor": "#A3A3A3"
          },
          "props": {
            "width": 300,
            "height": 250,
            "url": data.links.best_sellers.products[0].productImgUrl,
            "alt": data.links.best_sellers.products[0].productName,
            "linkHref": data.links.best_sellers.products[0].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017661625": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 20,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[0].productName.substring(0, 40)
          }
        }
      },
      "block-1745017677287": {
        "type": "Button",
        "data": {
          "style": {
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "ADD TO CART",
            "url": data.links.best_sellers.products[0].productURL
          }
        }
      },
      "block-1745017785844": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            },
            "backgroundColor": "#A3A3A3"
          },
          "props": {
            "width": 300,
            "height": 250,
            "url": data.links.best_sellers.products[1].productImgUrl,
            "alt": data.links.best_sellers.products[1].productName,
            "linkHref": data.links.best_sellers.products[1].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017808465": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 20,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[1].productName.substring(0, 40)
          }
        }
      },
      "block-1745017863341": {
        "type": "Button",
        "data": {
          "style": {
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "ADD TO CART",
            "url": data.links.best_sellers.products[1].productURL
          }
        }
      },
      "block-1745017974829": {
        "type": "ColumnsContainer",
        "data": {
          "style": {
            "padding": {
              "top": 0,
              "bottom": 28,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "columnsCount": 2,
            "columnsGap": 16,
            "columns": [
              {
                "childrenIds": [
                  "block-1745017989284",
                  "block-1745018004874",
                  "block-1745018007362"
                ]
              },
              {
                "childrenIds": [
                  "block-1745018009122",
                  "block-1745018022119",
                  "block-1745018024339"
                ]
              },
              {
                "childrenIds": []
              }
            ]
          }
        }
      },
      "block-1745017989284": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            },
            "backgroundColor": "#A3A3A3"
          },
          "props": {
            "width": 300,
            "height": 250,
            "url": data.links.best_sellers.products[2].productImgUrl,
            "alt": data.links.best_sellers.products[2].productName,
            "linkHref": data.links.best_sellers.products[2].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745018004874": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 20,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": data.links.best_sellers.products[2].productName.substring(0, 40)
          }
        }
      },
      "block-1745018007362": {
        "type": "Button",
        "data": {
          "style": {
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "ADD TO CART",
            "url": data.links.best_sellers.products[2].productURL
          }
        }
      },
      "block-1745018009122": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            },
            "backgroundColor": "#A3A3A3"
          },
          "props": {
            "width": 300,
            "height": 250,
            "url": data.links.best_sellers.products[3].productImgUrl,
            "alt": data.links.best_sellers.products[3].productName,
            "linkHref": data.links.best_sellers.products[3].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745018022119": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 20,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[3].productName.substring(0, 40)
          }
        }
      },
      "block-1745018024339": {
        "type": "Button",
        "data": {
          "style": {
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 0
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "ADD TO CART",
            "url": data.links.best_sellers.products[3].productURL
          }
        }
      },
      "block-1745512698059": {
        "type": "Divider",
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
            "lineColor": "#121212",
            "lineHeight": 30
          }
        }
      },
      "block-1745016821630": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 28,
              "bottom": 20,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "text": data.brand.data.aboutUs.paragraph1
          }
        }
      },
      "block-1745513016440": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontFamily": "ORGANIC_SANS",
            "fontSize": 18,
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 20,
              "right": 48,
              "left": 48
            }
          },
          "props": {
            "text": data.brand.data.aboutUs.paragraph2
          }
        }
      },
      "block-1745513106393": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 18,
            "backgroundColor": "#121212",
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 28,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "text": data.brand.data.aboutUs.paragraph3
          }
        }
      },
      "block-1745016882790": {
        "type": "Button",
        "data": {
          "style": {
            "backgroundColor": "#121212",
            "fontSize": 20,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "buttonTextColor": data.brand.colors.text,
            "size": "large",
            "text": "GET STARTED",
            "url": data.brand.url
          }
        }
      },
      "block-1745513147038": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 12,
              "bottom": 48,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": "Code: {% coupon_code 'WELCOME10' %}"
          }
        }
      },
      "block-1745018148134": {
        "type": "ColumnsContainer",
        "data": {
          "style": {
            "backgroundColor": "#393939",
            "padding": {
              "top": 24,
              "bottom": 24,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "fixedWidths": [
              184,
              184,
              184
            ],
            "columnsCount": 3,
            "columnsGap": 0,
            "columns": [
              {
                "childrenIds": [
                  "block-1745018267334",
                  "block-1745018408370"
                ]
              },
              {
                "childrenIds": [
                  "block-1745018339209",
                  "block-1745018461361"
                ]
              },
              {
                "childrenIds": [
                  "block-1745018374185",
                  "block-1745018495516"
                ]
              }
            ]
          }
        }
      },
      "block-1745018267334": {
        "type": "Avatar",
        "data": {
          "style": {
            "textAlign": "center",
            "padding": {
              "top": 12,
              "bottom": 0,
              "right": 36,
              "left": 36
            }
          },
          "props": {
            "size": 83,
            "shape": "circle",
            "imageUrl": data.brand.data.brandBenefits[0].DirectLink
          }
        }
      },
      "block-1745018408370": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 28,
              "bottom": 12,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "text": data.brand.data.brandBenefits[0].title
          }
        }
      },
      "block-1745018339209": {
        "type": "Avatar",
        "data": {
          "style": {
            "textAlign": "center",
            "padding": {
              "top": 12,
              "bottom": 0,
              "right": 36,
              "left": 36
            }
          },
          "props": {
            "size": 83,
            "shape": "circle",
            "imageUrl": data.brand.data.brandBenefits[1].DirectLink
          }
        }
      },
      "block-1745018461361": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 28,
              "bottom": 12,
              "right": 8,
              "left": 8
            }
          },
          "props": {
            "text": data.brand.data.brandBenefits[1].title
          }
        }
      },
      "block-1745018374185": {
        "type": "Avatar",
        "data": {
          "style": {
            "textAlign": "center",
            "padding": {
              "top": 12,
              "bottom": 0,
              "right": 36,
              "left": 36
            }
          },
          "props": {
            "size": 83,
            "shape": "circle",
            "imageUrl": data.brand.data.brandBenefits[2].DirectLink
          }
        }
      },
      "block-1745018495516": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 28,
              "bottom": 12,
              "right": 40,
              "left": 40
            }
          },
          "props": {
            "text": data.brand.data.brandBenefits[2].title
          }
        }
      },
      "block-1745018653395": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 40,
              "bottom": 0,
              "right": 60,
              "left": 60
            }
          },
          "props": {
            "text": "Thank you for visiting our store!"
          }
        }
      },
      "block-1745663752541": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 8,
              "bottom": 28,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": "Need assistance? Our support team is happy to assist."
          }
        }
      },
      "block-1745018750028": {
        "type": "Button",
        "data": {
          "style": {
            "backgroundColor": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 0,
              "bottom": 28,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonTextColor": data.brand.colors.text,
            "buttonStyle": "rectangle",
            "size": "large",
            "text": "SHOP NOW",
            "url": data.brand.url
          }
        }
      },
      "block-1745018809953": {
        "type": "ColumnsContainer",
        "data": {
          "style": {
            "backgroundColor": "#121212",
            "padding": {
              "top": 0,
              "bottom": 20,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "columnsCount": 2,
            "columnsGap": 20,
            "columns": [
              {
                "childrenIds": [
                  "block-1745018814626"
                ]
              },
              {
                "childrenIds": [
                  "block-1745018817336"
                ]
              },
              {
                "childrenIds": []
              }
            ]
          }
        }
      },
      "block-1745018814626": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "right",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 0,
              "left": 24
            }
          },
          "props": {
            "text": "Contacts"
          }
        }
      },
      "block-1745018817336": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "fontSize": 16,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "padding": {
              "top": 0,
              "bottom": 0,
              "right": 24,
              "left": 0
            }
          },
          "props": {
            "text": "FAQ"
          }
        }
      },
      "block-1745018885095": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#E5E5E5",
            "backgroundColor": "#A3A3A3",
            "fontSize": 12,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "normal",
            "textAlign": "center",
            "padding": {
              "top": 8,
              "bottom": 8,
              "right": 8,
              "left": 8
            }
          },
          "props": {
            "text": "No longer want to receive educational, transactional, and promotional emails from us? Unsubscribe."
          }
        }
      }
    }
  )
}
