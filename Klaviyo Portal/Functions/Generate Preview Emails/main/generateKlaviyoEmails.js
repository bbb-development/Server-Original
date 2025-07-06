import * as templateFunctions from '../../Functions/templateFunctions.js';

async function generateKlaviyoEmails(brand, emailID) {
    const brandData = brand.brandBrief.data.brand.data;
    const linksData = brand.bestSellers.data.links;
    const templateData = await templateFunctions.getTemplateData(emailID);
    
}