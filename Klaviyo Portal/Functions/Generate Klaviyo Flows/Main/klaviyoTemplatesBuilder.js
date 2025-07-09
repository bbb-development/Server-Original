import * as templateFunctions from '../../templateFunctions.js';
import crystalenergy from '../Misc/crystalenergy_updated_brand_data.json' with { type: 'json' };


// --- Block functions ---

export function logo(brandData, templateData) {
    const logo_img = templateFunctions.findSrcByText(templateData, 'logo_img_url');
    return [
        { oldText: logo_img, newText: brandData.preferred_logo_colors.selectedLogo.formats[0].src },
        { oldText: 'logo_img_url', newText: '' }
    ];
}

export function header(emailKey) {
    return (brandData, templateData) => {
        const header_img = templateFunctions.findSrcByText(templateData, 'header_image_url');
        return [
            { oldText: header_img, newText: brandData.emailImages[emailKey].directLink },
            { oldText: 'header_image_url', newText: '' }
        ];
    };
}

export function benefits(brandData, templateData) {
    const brand_benefits_1_img_url = templateFunctions.findSrcByText(templateData, 'brand_benefits_1_img_url');
    const brand_benefits_2_img_url = templateFunctions.findSrcByText(templateData, 'brand_benefits_2_img_url');
    const brand_benefits_3_img_url = templateFunctions.findSrcByText(templateData, 'brand_benefits_3_img_url');
    return [
        { oldText: 'brand_benefit_text_1', newText: brandData.brandBenefits[0].title },
        { oldText: 'brand_benefit_text_2', newText: brandData.brandBenefits[1].title },
        { oldText: 'brand_benefit_text_3', newText: brandData.brandBenefits[2].title },
        { oldText: brand_benefits_1_img_url, newText: brandData.brandBenefits[0].DirectLink },
        { oldText: brand_benefits_2_img_url, newText: brandData.brandBenefits[1].DirectLink },
        { oldText: brand_benefits_3_img_url, newText: brandData.brandBenefits[2].DirectLink },
        { oldText: 'brand_benefits_1_img_url', newText: '' },
        { oldText: 'brand_benefits_2_img_url', newText: '' },
        { oldText: 'brand_benefits_3_img_url', newText: '' }
    ];
}

export function color(brandData) {
    const textColor = brandData.preferred_logo_colors.selectedColor.brightness < 128 ? '#ffffff' : '#000000';
    return [
        { oldText: '#3290F5', newText: brandData.preferred_logo_colors.selectedColor.hex },
        { oldText: ['#FFFFF1', 'rgb(255, 255, 241)'], newText: textColor }
    ];
}

export function footerLinks(brandData) {
    return [
        { oldText: 'http://contact_us_link', newText: brandData.specialLinks.contactUrl },
        { oldText: 'http://faq_link', newText: brandData.specialLinks.faqUrl }
    ];
}

export function bestSellersLink(brandData) {
    return [
        { oldText: 'http://link_to_best_sellers', newText: brandData.specialLinks.bestSellersUrl }
    ];
}

export function deliverability(brandData) {
    return [
        { oldText: 'deliverability_text', newText: brandData.deliverabilitySnippet }
    ];
}

export function paragraphs(brandData) {
    return [
        { oldText: 'paragraph_1', newText: brandData.geminiBrandBrief.aboutUs.paragraph1 },
        { oldText: 'paragraph_2', newText: brandData.geminiBrandBrief.aboutUs.paragraph2 },
        { oldText: 'paragraph_3', newText: brandData.geminiBrandBrief.aboutUs.paragraph3 }
    ];
}

export function topEmailText(brandData) {
    return [
        { oldText: 'top_email_text', newText: brandData.geminiBrandBrief.topEmailText }
    ];
}

export function assistant(brandData) {
    return [
        { oldText: 'https://i.ibb.co/Kj5mL4GZ/blow-out-before-you-go-out-2025-04-06-07-16-30-utc.png', newText: brandData.assistant.assistant_img },
        { oldText: 'assistant_name', newText: brandData.assistant.assistant_name },
        { oldText: 'https://brand_url', newText: brandData.url }
    ];
}

export function mainProduct(brandData, templateData) {
    const main_product_img = templateFunctions.findSrcByText(templateData, 'main_product_img');
    return [
        { oldText: 'http://main_product_href', newText: brandData.bestSellers[0]?.productURL },
        { oldText: main_product_img, newText: brandData.bestSellers[0]?.productImgUrl },
        { oldText: 'main_product_img', newText: '' },
        { oldText: 'main_product_name', newText: brandData.bestSellers[0]?.productName }
    ];
}

export async function productFeed(emailID) {
    await templateFunctions.addAttributeToBlocks(emailID, [
        {
            findAttribute: 'feed_cols',
            addAttributes: {
                "feed": "SHOP_POPULAR_ALL_CATEGORIES"
            }
        }
    ]);
    return [];
}

// --- Email block definitions ---
const emailBlocks = {
    WF1: [logo, header('WF Email 1'), bestSellersLink, footerLinks, paragraphs, benefits, deliverability, color, productFeed],
    WF2: [logo, header('WF Email 2'), bestSellersLink, footerLinks, benefits, deliverability, color, productFeed],
    WF3: [logo, header('WF Email 3'), mainProduct, bestSellersLink, footerLinks, benefits, deliverability, color, productFeed],
    BA1: [logo, header('BA Email 1'), footerLinks, benefits, deliverability, color, productFeed],
    AC1: [topEmailText, logo, header('AC Email 1'), footerLinks, benefits, deliverability, color, productFeed],
    AC2: [topEmailText, logo, header('AC Email 2'), footerLinks, benefits, deliverability, color, productFeed],
    AC3: [topEmailText, logo, header('AC Email 3'), footerLinks, benefits, deliverability, color, productFeed],
    AC4: [assistant]
};

// --- Main generator ---
export async function generateEmailByType(emailType, brandData, emailID) {
    const templateData = await templateFunctions.getTemplateData(emailID);
    const blocks = emailBlocks[emailType];
    let allReplacements = [];
    for (const block of blocks) {
        if (block === productFeed) {
            await block(emailID);
        } else if (typeof block === 'function') {
            allReplacements = allReplacements.concat(block(brandData, templateData));
        }
    }
    if (allReplacements.length > 0) {
        await templateFunctions.batchUpdateTextInTemplate(emailID, allReplacements, templateData);
    }
}

// Example test usage
async function testAllTemplates() {
    const klaviyoTemplates = {
        "Welcome Flow": [
            { id: "SpZKLh", type: "WF1" },
            { id: "SjnvqT", type: "WF2" },
            { id: "Yf3Wdz", type: "WF3" }
        ],
        "Cart Abandoned Flow": [
            { id: "RLpd9P", type: "AC1" },
            { id: "X7qBvi", type: "AC2" },
            { id: "QTQpvV", type: "AC3" },
            { id: "XvJpat", type: "AC4" }
        ],
        "Browse Abandoned Flow": [
            { id: "Rb3aEN", type: "BA1" }
        ]
    };

    const allTemplates = [
        ...klaviyoTemplates["Welcome Flow"],
        ...klaviyoTemplates["Cart Abandoned Flow"],
        ...klaviyoTemplates["Browse Abandoned Flow"]
    ];

    const promises = allTemplates.map(async (template) => {
        const newTemplateID = await templateFunctions.cloneTemplate(template.id, template.type);
        await generateEmailByType(template.type, crystalenergy, newTemplateID);
        console.log(`✅ Generated ${template.type} from template ${template.id}`);
    });

    await Promise.all(promises);
    console.log('🎉 All email templates generated successfully!');
}

async function testSingle() {
    const newTemplateID = await templateFunctions.cloneTemplate('SpZKLh', 'WF 1');
    await generateEmailByType('WF1', crystalenergy, newTemplateID);
}

//await testSingle();
//await testAllTemplates();