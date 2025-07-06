import * as templateFunctions from '../../Functions/templateFunctions.js';

async function generateAC4(brand, emailID) {
    const brandData = brand.brandBrief.data.brand.data;

    const data = {
        image_url: 'https://i.ibb.co/Kj5mL4GZ/blow-out-before-you-go-out-2025-04-06-07-16-30-utc.png',
        name: 'assistant_name',
        brand_url: 'https://brand_url',
    };

    const replace_data = [
        { oldText: data.image_url, newText: brandData.assistant.assistant_img },
        { oldText: data.name, newText: brandData.assistant.assistant_name },
        { oldText: data.brand_url, newText: brand.brandBrief.data.brand.url }
    ];

    await templateFunctions.batchUpdateTextInTemplate(emailID, replace_data);
}

export default generateAC4;