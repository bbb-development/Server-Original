import { getRandomImageFromAlbum } from "../../Functions/imgBB Integration.js";
import { shuffleProducts } from "../../Functions/shuffle_products.js";

export async function generateTemplate(data) {
  const images = await getRandomImageFromAlbum("tZnk3N", "WF Email #2", 1);

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
            "block-1745017630525",
            "block-1745017630526",
            "block-1744989810113",
            "block-1745016821630",
            "block-1745016882790",
            "block-1745018148134",
            "block-1745018653395",
            "block-1745663774776",
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
            "text": 'Your Discount Expires Soon!'
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
              "right": 72,
              "left": 72
            }
          },
          "props": {
            "text": "Still Thinking\nAbout It?"
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
            "text": "Check our best-sellers below!"
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
            "buttonTextColor": data.brand.colors.text,
            "buttonStyle": "rectangle",
            "fullWidth": true,
            "size": "large",
            "text": "SHOP BEST SELLERS",
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
              "right": 28,
              "left": 28
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
              "bottom": 12,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "columnsCount": 3,
            "columnsGap": 16,
            "columns": [
              {
                "childrenIds": [
                  "block-1745017637589",
                  "block-1745017661625"
                ]
              },
              {
                "childrenIds": [
                  "block-1745017785844",
                  "block-1745017808465"
                ]
              },
              {
                "childrenIds": [
                  "block-1745513769399",
                  "block-1745513781886"
                ]
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
            "width": 200,
            "height": 170,
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
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[0].productName.substring(0, 40)
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
            "width": 200,
            "height": 170,
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
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[1].productName.substring(0, 40)
          }
        }
      },
      "block-1745513769399": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[2].productImgUrl,
            "alt": data.links.best_sellers.products[2].productName,
            "linkHref": data.links.best_sellers.products[2].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745513781886": {
        "type": "Text",
        "data": {
          "style": {
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[2].productName.substring(0, 40)
          }
        }
      },
      "block-1745017630525": {
        "type": "ColumnsContainer",
        "data": {
          "style": {
            "padding": {
              "top": 28,
              "bottom": 12,
              "right": 28,
              "left": 28
            }
          },
          "props": {
            "columnsCount": 3,
            "columnsGap": 16,
            "columns": [
              {
                "childrenIds": [
                  "block-1745017637588",
                  "block-1745017661626"
                ]
              },
              {
                "childrenIds": [
                  "block-1745017785845",
                  "block-1745017808466"
                ]
              },
              {
                "childrenIds": [
                  "block-1745513769398",
                  "block-1745513781887"
                ]
              }
            ]
          }
        }
      },
      "block-1745017637588": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[3].productImgUrl,
            "alt": data.links.best_sellers.products[3].productName,
            "linkHref": data.links.best_sellers.products[3].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017661626": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[3].productName.substring(0, 40)
          }
        }
      },
      "block-1745017785845": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[4].productImgUrl,
            "alt": data.links.best_sellers.products[4].productName,
            "linkHref": data.links.best_sellers.products[4].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017808466": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[4].productName.substring(0, 40)
          }
        }
      },
      "block-1745513769398": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[5].productImgUrl,
            "alt": data.links.best_sellers.products[5].productName,
            "linkHref": data.links.best_sellers.products[5].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745513781887": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": data.links.best_sellers.products[5].productName.substring(0, 40)
          }
        }
      },
      "block-1745017630526": {
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
            "columnsCount": 3,
            "columnsGap": 16,
            "columns": [
              {
                "childrenIds": [
                  "block-1745017637586",
                  "block-1745017661627"
                ]
              },
              {
                "childrenIds": [
                  "block-1745017785846",
                  "block-1745017808467"
                ]
              },
              {
                "childrenIds": [
                  "block-1745513769397",
                  "block-1745513781888"
                ]
              }
            ]
          }
        }
      },
      "block-1745017637586": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[6].productImgUrl,
            "alt": data.links.best_sellers.products[6].productName,
            "linkHref": data.links.best_sellers.products[6].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017661627": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[6].productName.substring(0, 40)
          }
        }
      },
      "block-1745017785846": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[7].productImgUrl,
            "alt": data.links.best_sellers.products[7].productName,
            "linkHref": data.links.best_sellers.products[7].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745017808467": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 12,
              "left": 12
            }
          },
          "props": {
            "text": data.links.best_sellers.products[7].productName.substring(0, 40)
          }
        }
      },
      "block-1745513769397": {
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
            "width": 200,
            "height": 170,
            "url": data.links.best_sellers.products[8].productImgUrl,
            "alt": data.links.best_sellers.products[8].productName,
            "linkHref": data.links.best_sellers.products[8].productURL,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745513781888": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#121212",
            "fontSize": 18,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 20,
              "bottom": 0,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "text": data.links.best_sellers.products[8].productName.substring(0, 40)
          }
        }
      },
      "block-1744989810113": {
        "type": "Image",
        "data": {
          "style": {
            "padding": {
              "top": 60,
              "bottom": 0,
              "right": 24,
              "left": 24
            },
            "backgroundColor": "#121212",
            "textAlign": "center"
          },
          "props": {
            "width": 160,
            "height": 54,
            "url": "https://raw.githubusercontent.com/ribalina/Test-SVG-upload/a2abecf6898680ce009d2e70b5393a60efa8dfba/svg%20info.svg",
            "alt": "Have Questions?",
            "linkHref": null,
            "contentAlignment": "middle"
          }
        }
      },
      "block-1745016821630": {
        "type": "Text",
        "data": {
          "style": {
            "color": "#ffffff",
            "backgroundColor": "#121212",
            "fontSize": 24,
            "fontFamily": "ORGANIC_SANS",
            "fontWeight": "bold",
            "textAlign": "center",
            "padding": {
              "top": 28,
              "bottom": 28,
              "right": 135,
              "left": 135
            }
          },
          "props": {
            "text": "Have questions or need help?\nOur team is here for you!"
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
              "bottom": 60,
              "right": 24,
              "left": 24
            }
          },
          "props": {
            "buttonBackgroundColor": data.brand.colors.background,
            "buttonStyle": "rectangle",
            "buttonTextColor": data.brand.colors.text,
            "size": "large",
            "text": "CONTACT US",
            "url": data.brand.url
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
      "block-1745663774776": {
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
