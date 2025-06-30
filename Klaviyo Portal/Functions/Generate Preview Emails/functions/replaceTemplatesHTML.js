import { klaviyoLabelHtml } from './klaviyoLabelHtml.js';
export function replaceHTML(brand, html, email) {
    
    console.log('🔄 Processing template for brand:', brand.brandSummary?.name || 'Unknown');
    
    // Shuffle the best sellers to randomize product order
    const shuffledBestSellers = shuffleProducts(brand.bestSellers, 9);
    console.log('🔀 Shuffled best sellers for randomized product display');
    
    // Get background color (accent first, then dark as fallback)
    const backgroundColorObj = brand.brandSummary?.colors?.find(color => color.type === 'accent') || 
                               brand.brandSummary?.colors?.find(color => color.type === 'dark') || null;
    
    const backgroundColor = backgroundColorObj?.hex || null;
    
    // Determine text color based on background brightness (white for dark backgrounds, black for light)
    const textColor = backgroundColorObj?.brightness < 128 ? '#ffffff' : '#000000';

    const colors = [    
        {
            // Replace Background Color
            find: '#3290F5',
            replace: backgroundColor,
            description: 'Background color',
            type: 'text'
        },
        {
            // Replace text color based on background brightness
            find: ['rgb(255, 255, 241)', '#FFFFF1'], // Multiple text colors to replace
            replace: textColor,
            description: 'Text color',
            type: 'text'
        }
    ];

    const topEmailText = [
        {
            // Replace top email text
            find: ['top_email_text'],
            replace: brand.geminiBrandBrief?.topEmailText || null,
            description: 'Top Email Text',
            type: 'text'
        }
    ];

    const deliverabilityText = [
        {
            // Replace deliverability text
            find: ['deliverability_text'],
            replace: brand.deliverabilitySnippet || null,
            description: 'Deliverability Text',
            type: 'text'
        }
    ];

    const brandName = [
        {
            // Replace brand name
            find: ['BBB Marketing'],
            replace: brand.brandSummary?.name || null,
            description: 'Brand Name',
            type: 'text'
        }
    ];

    const logoImage = [
        {
            // Replace Brand Logo
            altAttribute: 'logo_img_url',
            replace: brand.brandSummary?.logos?.find(logo => logo.type === 'logo')?.formats?.[0]?.src || null,
            description: 'Brand logo',
            type: 'image'
        },
        {
            // Replace Brand Logo Alt Text
            find: 'logo_img_url',
            replace: '',
            description: 'Brand logo alt text',
            type: 'text'
        }
    ];

    const headerImage = (imageKey) => [
        {
            // Replace Header Image
            altAttribute: 'header_image_url',
            replace: brand.emailImages?.[imageKey]?.directLink || null,
            description: 'Header image',
            type: 'image'
        },
        {
            // Replace Header Image Alt Text
            find: 'header_image_url',
            replace: '',
            description: 'Header image alt text',
            type: 'text'
        }
    ];

    const aboutUsParagraphs = [
        {
            // Replace Paragraph 1
            find: ['paragraph_1'],
            replace: brand.geminiBrandBrief?.aboutUs?.paragraph1 || null,
            description: 'Paragraph 1',
            type: 'text'
        },
        {
            // Replace Paragraph 2
            find: ['paragraph_2'],
            replace: brand.geminiBrandBrief?.aboutUs?.paragraph2 || null,
            description: 'Paragraph 2',
            type: 'text'
        },
        {
            // Replace Paragraph 3
            find: ['paragraph_3'],
            replace: brand.geminiBrandBrief?.aboutUs?.paragraph3 || null,
            description: 'Paragraph 3',
            type: 'text'
        },    
    ];

    const footerLinks = [
        {
            // Replace contact us link
            find: ['http://contact_us_link'],
            replace: brand.specialLinks.contactUrl || null,
            description: 'Contact Us Link',
            type: 'text'
        },
        {
            // Replace FAQ link
            find: ['http://faq_link'],
            replace: brand.specialLinks.faqUrl || null,
            description: 'FAQ Link',
            type: 'text'
        }
    ];

    const klaviyoLabel = [
        {
            // Remove Klaviyo Label - dynamically extract from HTML
            find: klaviyoLabelHtml(html),
            replace: '',
            description: 'Klaviyo Label',
            type: 'text'
        }
    ];

    const bestSellersLink = [
        {
            // Replace best sellers link
            find: ['http://link_to_best_sellers'],
            replace: brand.specialLinks.bestSellersUrl || null,
            description: 'Best Sellers Link',
            type: 'text'
        }
    ];

    const assistantData = [
        {
            // Replace Assistant Data
            find: ['https://i.ibb.co/Kj5mL4GZ/blow-out-before-you-go-out-2025-04-06-07-16-30-utc.png'],
            replace: brand.assistant.assistant_img || null,
            description: 'Assistant Image',
            type: 'text'
        },
        {
            // Replace Assistant Name
            find: ['assistant_name'],
            replace: brand.assistant.assistant_name || null,
            description: 'Assistant Name',
            type: 'text'
        },
        {
            // Replace Assistant Name
            find: ['https://brand_url'],
            replace: brand.url || null,
            description: 'Brand URL',
            type: 'text'
        }
    ];

    const brandBenefits = [
        {
            // Replace Brand Benefit 1 Image
            altAttribute: 'brand_benefits_1_img_url',
            replace: brand.brandBenefits[0].DirectLink || null,
            description: 'Brand Benefit 1 Image',
            type: 'image'
        },
        {
            // Replace Brand Benefit 2 Image
            altAttribute: 'brand_benefits_2_img_url',
            replace: brand.brandBenefits[1].DirectLink || null,
            description: 'Brand Benefit 2 Image',
            type: 'image'
        },
        {
            // Replace Brand Benefit 3 Image
            altAttribute: 'brand_benefits_3_img_url',
            replace: brand.brandBenefits[2].DirectLink || null,
            description: 'Brand Benefit 3 Image',
            type: 'image'
        },
        {
            // Replace Brand Benefit 1
            find: ['brand_benefit_text_1'],
            replace: brand.brandBenefits[0].title || null,
            description: 'Brand Benefit 1 Text',
            type: 'text'
        },
        {
            // Replace Brand Benefit 2
            find: ['brand_benefit_text_2'],
            replace: brand.brandBenefits[1].title || null,
            description: 'Brand Benefit 2 Text',
            type: 'text'
        },
        {
            // Replace Brand Benefit 3
            find: ['brand_benefit_text_3'],
            replace: brand.brandBenefits[2].title || null,
            description: 'Brand Benefit 3 Text',
            type: 'text'
        },
        {
            // Replace Brand Benefit 1 Alt Text
            find: 'brand_benefits_1_img_url',
            replace: '',
            description: 'Brand Benefit 1 Alt Text',
            type: 'text'
        },
        {
            // Replace Brand Benefit 2 Alt Text
            find: 'brand_benefits_2_img_url',
            replace: '',
            description: 'Brand Benefit 2 Alt Text',
            type: 'text'
        },
        {
            // Replace Brand Benefit 3 Alt Text
            find: 'brand_benefits_3_img_url',
            replace: '',
            description: 'Brand Benefit 3 Alt Text',
            type: 'text'
        },
    ];

    const mainProduct = [
        {
            // Replace Main Product Image
            altAttribute: 'main_product_img',
            replace: shuffledBestSellers[0]?.productImgUrl || null,
            description: 'Main Product',
            type: 'image'
        },
        {
            // Replace Main Product Name
            find: ['main_product_name'],
            replace: shuffledBestSellers[0]?.productName || null,
            description: 'Main Product Name',
            type: 'text'
        },
        {
            // Replace Main Product Link
            find: ['http://main_product_href'],
            replace: shuffledBestSellers[0]?.productURL || null,
            description: 'Main Product Link',
            type: 'text'
        },
        {
            // Replace Main Product Image
            find: 'main_product_img',
            replace: '',
            description: 'Main Product Alt Text',
            type: 'text'
        }
    ];

    const abandonedProducts = [
        {
            // Replace Abandoned Cart Product Image
            find: ['https://cdn.shopify.com/s/files/1/0952/3622/7421/files/image.png?v=1747148039', 'https://cq2sff-ue.myshopify.com/cdn/shop/files/image-6_grande.png?v=1747148157'],
            replace: shuffledBestSellers[6]?.productImgUrl || null,
            description: 'Abandoned Cart Product',
            type: 'text'
        },
        {
            // Replace Abandoned Cart Product Image Link
            find: ['https://cq2sff-ue.myshopify.com/95236227421/checkouts/ac/Z2NwLWV1cm9wZS13ZXN0MzowMUpWVlY1R0I5UENZMDAyWUU0UUNHTlgxVg/recover', 'https://cq2sff-ue.myshopify.com/products/white-chair-7'],
            replace: shuffledBestSellers[6]?.productURL || null,
            description: 'Abandoned Cart Product Link',
            type: 'text'
        },
        {
            // Replace Abandoned Cart Product Image
            find: ['White Chair 1', 'White Chair 7'],
            replace: shuffledBestSellers[6]?.productName || null,
            description: 'Abandoned Cart Product Name',
            type: 'text'
        },
        {
            // Replace Abandoned Cart Product Image
            find: ['$50.00', '50.00 лв'],
            replace: shuffledBestSellers[6]?.productPrice || null,
            description: 'Abandoned Cart Product Price',
            type: 'text'
        }
    ];

    const sixBestSellers = [    
        {
            // Replace Best Seller 1 Image
            altAttribute: 'Image of White Chair 1',
            replace: shuffledBestSellers[0].productImgUrl || null,
            description: 'Best Seller 1',
            type: 'image'
        },
        {
            // Replace Best Seller 2 Image
            altAttribute: 'Image of White Chair 2',
            replace: shuffledBestSellers[1].productImgUrl || null,
            description: 'Best Seller 2',
            type: 'image'
        },
        {
            // Replace Best Seller 3 Image
            altAttribute: 'Image of White Chair 3',
            replace: shuffledBestSellers[2].productImgUrl || null,
            description: 'Best Seller 3',
            type: 'image'
        },
        {
            // Replace Best Seller 4 Image
            altAttribute: 'Image of White Chair 4',
            replace: shuffledBestSellers[3].productImgUrl || null,
            description: 'Best Seller 4',
            type: 'image'
        },
        {
            // Replace Best Seller 5 Image
            altAttribute: 'Image of White Chair 5',
            replace: shuffledBestSellers[4].productImgUrl || null,
            description: 'Best Seller 5',
            type: 'image'
        },
        {
            // Replace Best Seller 6 Image
            altAttribute: 'Image of White Chair 6',
            replace: shuffledBestSellers[5].productImgUrl || null,
            description: 'Best Seller 6',
            type: 'image'
        },
        {
            // Replace Best Seller 1 Image
            altAttribute: 'Image of White Chair 1',
            replace: shuffledBestSellers[0].productImgUrl || null,
            description: 'Best Seller 1',
            type: 'image'
        },
        {
            // Replace Best Seller 2 Image
            altAttribute: 'Image of White Chair 2',
            replace: shuffledBestSellers[1].productImgUrl || null,
            description: 'Best Seller 2',
            type: 'image'
        },
        {
            // Replace Best Seller 3 Image
            altAttribute: 'Image of White Chair 3',
            replace: shuffledBestSellers[2].productImgUrl || null,
            description: 'Best Seller 3',
            type: 'image'
        },
        {
            // Replace Best Seller 4 Image
            altAttribute: 'Image of White Chair 4',
            replace: shuffledBestSellers[3].productImgUrl || null,
            description: 'Best Seller 4',
            type: 'image'
        },
        {
            // Replace Best Seller 5 Image
            altAttribute: 'Image of White Chair 5',
            replace: shuffledBestSellers[4].productImgUrl || null,
            description: 'Best Seller 5',
            type: 'image'
        },
        {
            // Replace Best Seller 6 Image
            altAttribute: 'Image of White Chair 6',
            replace: shuffledBestSellers[5].productImgUrl || null,
            description: 'Best Seller 6',
            type: 'image'
        },
        {
            // Replace Product 1 Name
            find: ['White Chair 1'],
            replace: shuffledBestSellers[0].productName || null,
            description: 'Best Seller 1',
            type: 'text'
        },
        {
            // Replace Product 2 Name
            find: ['White Chair 2'],
            replace: shuffledBestSellers[1].productName || null,
            description: 'Best Seller 2',
            type: 'text'
        },
        {
            // Replace Product 3 Name
            find: ['White Chair 3'],
            replace: shuffledBestSellers[2].productName || null,
            description: 'Best Seller 3',
            type: 'text'
        },
        {
            // Replace Product 4 Name
            find: ['White Chair 4'],
            replace: shuffledBestSellers[3].productName || null,
            description: 'Best Seller 4',
            type: 'text'
        },
        {
            // Replace Product 5 Name
            find: ['White Chair 5'],
            replace: shuffledBestSellers[4].productName || null,
            description: 'Best Seller 5',
            type: 'text'
        },
        {
        // Replace Product 6 Name
            find: ['White Chair 6'],
            replace: shuffledBestSellers[5].productName || null,
            description: 'Best Seller 6',
            type: 'text'
        },
        {
            // Replace Product 1 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-1'],
            replace: shuffledBestSellers[0].productURL || null,
            description: 'Best Seller 1 Link',
            type: 'text'
        },
        {
            // Replace Product 2 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-2'],
            replace: shuffledBestSellers[1].productURL || null,
            description: 'Best Seller 2 Link',
            type: 'text'
        },
        {
            // Replace Product 3 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-3'],
            replace: shuffledBestSellers[2].productURL || null,
            description: 'Best Seller 3 Link',
            type: 'text'
        },
        {
            // Replace Product 4 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-4'],
            replace: shuffledBestSellers[3].productURL || null,
            description: 'Best Seller 4 Link',
            type: 'text'
        },
        {
            // Replace Product 5 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-5'],
            replace: shuffledBestSellers[4].productURL || null,
            description: 'Best Seller 5 Link',
            type: 'text'
        },
        {
            // Replace Product 6 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-6'],
            replace: shuffledBestSellers[5].productURL || null,
            description: 'Best Seller 6 Link',
            type: 'text'
        }
    ];

    const nineBestSellers = [        
        {
            // Replace Best Seller 1 Image
            altAttribute: 'Image of White Chair 1',
            replace: shuffledBestSellers[0].productImgUrl || null,
            description: 'Best Seller 1',
            type: 'image'
        },
        {
            // Replace Best Seller 2 Image
            altAttribute: 'Image of White Chair 2',
            replace: shuffledBestSellers[1].productImgUrl || null,
            description: 'Best Seller 2',
            type: 'image'
        },
        {
            // Replace Best Seller 3 Image
            altAttribute: 'Image of White Chair 3',
            replace: shuffledBestSellers[2].productImgUrl || null,
            description: 'Best Seller 3',
            type: 'image'
        },
        {
            // Replace Best Seller 4 Image
            altAttribute: 'Image of White Chair 4',
            replace: shuffledBestSellers[3].productImgUrl || null,
            description: 'Best Seller 4',
            type: 'image'
        },
        {
            // Replace Best Seller 5 Image
            altAttribute: 'Image of White Chair 5',
            replace: shuffledBestSellers[4].productImgUrl || null,
            description: 'Best Seller 5',
            type: 'image'
        },
        {
            // Replace Best Seller 6 Image
            altAttribute: 'Image of White Chair 6',
            replace: shuffledBestSellers[5].productImgUrl || null,
            description: 'Best Seller 6',
            type: 'image'
        },
        {
            // Replace Best Seller 7 Image
            altAttribute: 'Image of White Chair 7',
            replace: shuffledBestSellers[6].productImgUrl || null,
            description: 'Best Seller 7',
            type: 'image'
        },
        {
            // Replace Best Seller 8 Image
            altAttribute: 'Image of White Chair 8',
            replace: shuffledBestSellers[7].productImgUrl || null,
            description: 'Best Seller 8',
            type: 'image'
        },
        {
            // Replace Best Seller 9 Image
            altAttribute: 'Image of White Chair 9',
            replace: shuffledBestSellers[8].productImgUrl || null,
            description: 'Best Seller 9',
            type: 'image'
        },
        {
            // Replace Product 1 Name
            find: ['White Chair 1'],
            replace: shuffledBestSellers[0].productName || null,
            description: 'Best Seller 1',
            type: 'text'
        },
        {
            // Replace Product 2 Name
            find: ['White Chair 2'],
            replace: shuffledBestSellers[1].productName || null,
            description: 'Best Seller 2',
            type: 'text'
        },
        {
            // Replace Product 3 Name
            find: ['White Chair 3'],
            replace: shuffledBestSellers[2].productName || null,
            description: 'Best Seller 3',
            type: 'text'
        },
        {
            // Replace Product 4 Name
            find: ['White Chair 4'],
            replace: shuffledBestSellers[3].productName || null,
            description: 'Best Seller 4',
            type: 'text'
        },
        {
            // Replace Product 5 Name
            find: ['White Chair 5'],
            replace: shuffledBestSellers[4].productName || null,
            description: 'Best Seller 5',
            type: 'text'
        },
        {
            // Replace Product 6 Name
            find: ['White Chair 6'],
            replace: shuffledBestSellers[5].productName || null,
            description: 'Best Seller 6',
            type: 'text'
        },
        {
            // Replace Product 7 Name
            find: ['White Chair 7'],
            replace: shuffledBestSellers[6].productName || null,
            description: 'Best Seller 7',
            type: 'text'
        },
        {   
            // Replace Product 8 Name
            find: ['White Chair 8'],
            replace: shuffledBestSellers[7].productName || null,
            description: 'Best Seller 8',
            type: 'text'
        },
        {   
            // Replace Product 9 Name
            find: ['White Chair 9'],
            replace: shuffledBestSellers[8].productName || null,
            description: 'Best Seller 9',
            type: 'text'
        },
        {   
            // Replace Product 1 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-1'],
            replace: shuffledBestSellers[0].productURL || null,
            description: 'Best Seller 1 Link',
            type: 'text'
        },
        {
            // Replace Product 2 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-2'],
            replace: shuffledBestSellers[1].productURL || null,
            description: 'Best Seller 2 Link',
            type: 'text'
        },
        {
            // Replace Product 3 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-3'],
            replace: shuffledBestSellers[2].productURL || null,
            description: 'Best Seller 3 Link',
            type: 'text'
        },
        {
            // Replace Product 4 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-4'],
            replace: shuffledBestSellers[3].productURL || null,
            description: 'Best Seller 4 Link',
            type: 'text'
        },
        {
            // Replace Product 5 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-5'],
            replace: shuffledBestSellers[4].productURL || null,
            description: 'Best Seller 5 Link',
            type: 'text'
        },
        {
            // Replace Product 6 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-6'],
            replace: shuffledBestSellers[5].productURL || null,
            description: 'Best Seller 6 Link',
            type: 'text'
        },
        {
            // Replace Product 7 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-7'],
            replace: shuffledBestSellers[6].productURL || null,
            description: 'Best Seller 7 Link',
            type: 'text'
        },
        {
            // Replace Product 8 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-8'],
            replace: shuffledBestSellers[7].productURL || null,
            description: 'Best Seller 8 Link',
            type: 'text'
        },
        {
            // Replace Product 9 Link
            find: ['https://cq2sff-ue.myshopify.com/products/white-chair-9'],
            replace: shuffledBestSellers[8].productURL || null,
            description: 'Best Seller 9 Link',
            type: 'text'
        }
    ];

    // Define email templates - you can add more templates here
    const emailTemplates = {
        // Welcome Flow 1
        SpZKLh: [colors, logoImage, headerImage('WF Email 1'), brandName, sixBestSellers, bestSellersLink, aboutUsParagraphs, brandBenefits, deliverabilityText, footerLinks, klaviyoLabel],
        
        // Welcome Flow 2
        SjnvqT: [colors, logoImage, headerImage('WF Email 2'), nineBestSellers, bestSellersLink, brandBenefits, deliverabilityText, footerLinks, klaviyoLabel],

        // Welcome Flow 3
        Yf3Wdz: [colors, logoImage, headerImage('WF Email 3'), mainProduct, sixBestSellers, bestSellersLink, brandBenefits, deliverabilityText, footerLinks, klaviyoLabel],

        // Cart Abandoned 1
        RLpd9P: [colors, logoImage, headerImage('AC Email 1'), topEmailText, abandonedProducts, sixBestSellers, brandBenefits, footerLinks, deliverabilityText, klaviyoLabel],

        // Cart Abandoned 2
        X7qBvi: [colors, logoImage, headerImage('AC Email 2'), topEmailText, abandonedProducts, sixBestSellers, brandBenefits, footerLinks, deliverabilityText, klaviyoLabel],

        // Cart Abandoned 3
        QTQpvV: [colors, logoImage, headerImage('AC Email 3'), topEmailText, abandonedProducts, sixBestSellers, brandBenefits, footerLinks, deliverabilityText, klaviyoLabel],

        // Cart Abandoned 4
        XvJpat: [assistantData, klaviyoLabel],

        // Browse Abandoned 1
        Rb3aEN: [colors, logoImage, headerImage('BA Email 1'), abandonedProducts, sixBestSellers, brandBenefits, footerLinks, deliverabilityText, klaviyoLabel],
    };

    const modifiedHtml = applyReplacements(emailTemplates[email], html);
    
    console.log('✅ Template processing complete');
    return modifiedHtml; 
}



    // Smart replacement function that handles both text and image replacements
function applyReplacements(replacementArrays, html) {
    let modifiedHtml = html;
    
    replacementArrays.forEach(replacementArray => {
        replacementArray.forEach(replacement => {
            const { type, replace, description } = replacement;
            
            // Allow empty strings as valid replacements, but skip null/undefined
            if (replace === null || replace === undefined) {
                console.warn(`⚠️ ${description}: Replacement value not found in brand data`);
                return;
            }
            if (type === 'image' || replacement.altAttribute) {
                // Handle image replacements by alt attribute
                const { altAttribute } = replacement;
                const imgRegex = new RegExp(`(<img[^>]*alt=["']${escapeRegExp(altAttribute)}["'][^>]*src=["'])([^"']+)(["'][^>]*>)`, 'gi');
                const matches = modifiedHtml.match(imgRegex);
                
                if (matches && matches.length > 0) {
                    modifiedHtml = modifiedHtml.replace(imgRegex, `$1${replace}$3`);
                    console.log(`✅ ${description}: Replaced ${matches.length} occurrence(s) by alt="${altAttribute}"`);
                    console.log(`   To: ${replace}`);
                } else {
                    console.warn(`⚠️ ${description}: Image with alt="${altAttribute}" not found in HTML`);
                }
            } else if (type === 'text' || replacement.find) {
                // Handle text replacements
                const { find } = replacement;
                const findValues = Array.isArray(find) ? find : [find];
                let totalOccurrences = 0;
                
                findValues.forEach(findValue => {
                    const occurrences = (modifiedHtml.match(new RegExp(escapeRegExp(findValue), 'g')) || []).length;
                    if (occurrences > 0) {
                        modifiedHtml = modifiedHtml.replaceAll(findValue, replace);
                        totalOccurrences += occurrences;
                    }
                });
                
                if (totalOccurrences > 0) {
                    console.log(`✅ ${description}: Replaced ${totalOccurrences} occurrence(s)`);
                    console.log(`   From: ${Array.isArray(find) ? find.join(', ') : find}`);
                    console.log(`   To:   ${replace}`);
                } else {
                    console.warn(`⚠️ ${description}: Text not found in HTML`);
                }
            }
        });
    });
    
    return modifiedHtml;
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Shuffle function to randomize product order using Fisher-Yates algorithm
export function shuffleProducts(products, minCount = 9) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  // Check for any undefined/null products
  const validProducts = products.filter(product => product && product.productImgUrl && product.productName && product.productURL);
  
  if (validProducts.length === 0) {
    console.error('shuffleProducts: No valid products found!');
    return [];
  }
  
  // If we don't have enough products, duplicate them to reach minimum count
  let workingProducts = [...validProducts];
  while (workingProducts.length < minCount && validProducts.length > 0) {
    const duplicateIndex = workingProducts.length % validProducts.length;
    workingProducts.push({ ...validProducts[duplicateIndex] });
  }
  
  // Fisher-Yates shuffle algorithm
  for (let i = workingProducts.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // Swap elements at i and randomIndex
    [workingProducts[i], workingProducts[randomIndex]] = [workingProducts[randomIndex], workingProducts[i]];
  }

  return workingProducts;
}