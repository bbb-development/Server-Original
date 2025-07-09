import * as templateFunctions from '../../Klaviyo Portal/Functions/templateFunctions.js';
import crystalenergy from '../../Klaviyo Portal/Functions/Generate Klaviyo Flows/Misc/crystalenergy_updated_brand_data.json' with { type: 'json' };

async function generateAC4(brandData, emailID) {
    const data = {
        image_url: 'https://i.ibb.co/Kj5mL4GZ/blow-out-before-you-go-out-2025-04-06-07-16-30-utc.png',
        name: 'assistant_name',
        brand_url: 'https://brand_url',
    };
    const replace_data = [
        { oldText: data.image_url, newText: brandData.assistant.assistant_img },
        { oldText: data.name, newText: brandData.assistant.assistant_name },
        { oldText: data.brand_url, newText: brandData.url }
    ];
    await templateFunctions.batchUpdateTextInTemplate(emailID, replace_data);
}

async function test() {
    const newTemplateID = await templateFunctions.cloneTemplate('XvJpat', 'AC 4');
    console.log(newTemplateID);
    generateAC4(crystalenergy, newTemplateID);
}

export default generateAC4;

await test();