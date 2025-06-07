import * as templateFunctions from '../../Functions/templateFunctions.js';

async function generateWF1(brand, emailID) {
    const brandData = brand.brandBrief.data.brand.data;
    const linksData = brand.bestSellers.data.links;
    const templateData = await templateFunctions.getTemplateData(emailID);
    
    // Dynamically extract src values by searching for specific placeholder text
    const [logo_img, header_img, brand_benefits_1_img_url, brand_benefits_2_img_url, brand_benefits_3_img_url] = await Promise.all([
        templateFunctions.findSrcByText(templateData, 'logo_img_url'),
        templateFunctions.findSrcByText(templateData, 'header_image_url'),
        templateFunctions.findSrcByText(templateData, 'brand_benefits_1_img_url'),
        templateFunctions.findSrcByText(templateData, 'brand_benefits_2_img_url'),
        templateFunctions.findSrcByText(templateData, 'brand_benefits_3_img_url')
    ]);

    const data = {
        logo_img: logo_img,
        header_img: header_img,
        logo_img_url: 'logo_img_url',
        header_image_url: 'header_image_url',
        contact_us_link: 'http://contact_us_link',
        faq_link: 'http://faq_link',
        link_to_best_sellers: 'http://link_to_best_sellers',
        paragraph_1: 'paragraph_1',
        paragraph_2: 'paragraph_2',
        paragraph_3: 'paragraph_3',
        brand_benefit_text_1: 'brand_benefit_text_1',
        brand_benefit_text_2: 'brand_benefit_text_2',
        brand_benefit_text_3: 'brand_benefit_text_3',
        brand_benefit_img_1: brand_benefits_1_img_url,
        brand_benefit_img_2: brand_benefits_2_img_url,
        brand_benefit_img_3: brand_benefits_3_img_url,
        brand_benefit_1_alt: 'brand_benefits_1_img_url',
        brand_benefit_2_alt: 'brand_benefits_2_img_url',
        brand_benefit_3_alt: 'brand_benefits_3_img_url',
        deliverability_text: 'deliverability_text',
        brand_background_color: '#3290F5',
        brand_text_color: '#FFFFF1'
    };

    const replace_data = [
        { oldText: data.logo_img, newText: brand.brandBrief.data.brand.logo.url }, 
        { oldText: data.header_img, newText: brandData.emailImages['WF Email 1'].directLink }, 
        { oldText: data.logo_img_url, newText: '' },
        { oldText: data.header_image_url, newText: '' },
        { oldText: data.contact_us_link, newText: linksData.contact.url }, 
        { oldText: data.faq_link, newText: linksData.faq.url },
        { oldText: data.link_to_best_sellers, newText: linksData.best_sellers.url },
        { oldText: data.deliverability_text, newText: brandData.deliverabilitySnippet },
        { oldText: data.paragraph_1, newText: brandData.aboutUs.paragraph1 },
        { oldText: data.paragraph_2, newText: brandData.aboutUs.paragraph2 },
        { oldText: data.paragraph_3, newText: brandData.aboutUs.paragraph3 },
        { oldText: data.brand_benefit_text_1, newText: brandData.brandBenefits[0].title },
        { oldText: data.brand_benefit_text_2, newText: brandData.brandBenefits[1].title },
        { oldText: data.brand_benefit_text_3, newText: brandData.brandBenefits[2].title },
        { oldText: data.brand_benefit_img_1, newText: brandData.brandBenefits[0].DirectLink },
        { oldText: data.brand_benefit_img_2, newText: brandData.brandBenefits[1].DirectLink },
        { oldText: data.brand_benefit_img_3, newText: brandData.brandBenefits[2].DirectLink },
        { oldText: data.brand_benefit_1_alt, newText: '' },
        { oldText: data.brand_benefit_2_alt, newText: '' },
        { oldText: data.brand_benefit_3_alt, newText: '' },
        { oldText: data.brand_background_color, newText: brand.brandBrief.data.brand.colors.background },
        { oldText: data.brand_text_color, newText: brand.brandBrief.data.brand.colors.text }
    ];

    await templateFunctions.batchUpdateTextInTemplate(emailID, replace_data, templateData);
    
    // Add product feed to the template
    await templateFunctions.addAttributeToBlocks(emailID, [
        {
        findAttribute: 'feed_cols',
        addAttributes: {
            "feed": "SHOP_POPULAR_ALL_CATEGORIES"
        }
        }
    ]);
}

export default generateWF1;