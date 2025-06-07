import * as smallFunctions from './Functions/smallFunctions.js';
import * as listFunctions from './Functions/listFunctions.js';
import * as templateFunctions from './Functions/templateFunctions.js';
import * as flowFunctions from './Functions/flowFunctions.js';
import * as emailTemplates from './Functions/templatesExport.js';

/////////////////////////
//  SMALL FUNCTIONS   //
/////////////////////////

// Get profile
//smallFunctions.getProfile();

// Change client
//await smallFunctions.changeClient('ShNPvE');

// Get company ID
//smallFunctions.getCompanyID('ALL'); // 'all' or 'company_name'

// Get metrics
//const metrics = await smallFunctions.fetchKlaviyoMetrics();
//console.log(JSON.stringify(metrics, null, 2));

/////////////////////////
//   LIST FUNCTIONS   //
/////////////////////////

// Get lists
//listFunctions.getLists();

// Convert to list
//listFunctions.convertToList('VbSFXN');

// Delete list
//listFunctions.deleteList('YaMn9X');

// Create list
//listFunctions.createList('Test List3');

// Suppress list
//listFunctions.listSuppression('YekEHx', 'unsuppress'); // suppress or unsuppress

/////////////////////////
//   FLOW FUNCTIONS   //
/////////////////////////

// Get flows
//flowFunctions.getFlows();

// Get flow messages
//const result = await flowFunctions.getFlowMessages('UE5FaC');
//console.log(JSON.stringify(result, null, 2));

// Get flow clone mapping candidates
//const mappingCandidates = await flowFunctions.getFlowCloneMappingCandidates('Si6sJY', 'S22rRA');
//console.log(JSON.stringify(mappingCandidates, null, 2));

// Get flow data
//const flowData = await flowFunctions.getFlowData('Xir9UH');
//console.log(JSON.stringify(flowData, null, 2));

// Get unique elements
//const uniqueElements = await flowFunctions.getUniqueElements('Xir9UH');
//console.log(JSON.stringify(uniqueElements, null, 2));

// Check if all unique elements are available for cloning
//await flowFunctions.checkUniqueElementsForCloning('Xir9UH', 'S22rRA');

// Clone flow - Source Flow ID | Target Company ID | New Flow Name
//const result = await flowFunctions.crossAccountFlowClone(
//  'Xir9UH', 
//  'ShNPvE', 
//  'FlowFastAI | Abandoned Cart Flow (clone2)'
//);
//
//if (result.success) {
//  console.log(`✅ Clone completed in ${result.completionTime} seconds`);
//} else {
//  console.log(`❌ Clone failed: ${result.error}`);
//}

// Get base flows IDs
//const result = await flowFunctions.getBaseFlowsIDs([
//  "FlowFastAI | Abandoned Cart Flow (clone2)", 
//  "Citrine Back in Stock", 
//  "Browse Abandonment"
//]);

//console.log(JSON.stringify(result, null, 2));

/////////////////////////
// CAMPAIGN FUNCTIONS //
/////////////////////////

// Get campaigns
//smallFunctions.getCampaigns();

// Get campaign messages
//smallFunctions.getCampaignMessages('01JTJD63S55QZJ47FPD1J14RJ8');

/////////////////////////
//  COUPON FUNCTIONS  //
/////////////////////////

// 1. Basic percentage coupon
// 10% off, no minimum purchase required, starts now, expires in 5 days

//await smallFunctions.createCoupon({
//    name: 'WELCOME10TEST',
//    prefix: 'WEL',
//    discountType: 'percentage',
//    discountAmount: 10,
//    expiration: 'days:5'
//});


// 2. Fixed amount coupon with minimum purchase:
// 20$ off, minimum purchase of $100, starts now, expires in 48 hours

//await smallFunctions.createCoupon({
//    name: 'SAVE20TEST',
//    prefix: 'SAV',
//    discountType: 'fixed',
//    discountAmount: 20,
//    minimumPurchase: 100,
//    expiration: 'hours:48'
//});

// 3. Coupon that starts on a specific date and expires on another date:
// 25% off, minimum purchase of $50, starts on 01/06/2025, expires on 30/06/2025

//await smallFunctions.createCoupon({
//    name: 'HOLIDAY26TEST',
//    prefix: 'HO2L',
//    discountType: 'percentage',
//    discountAmount: 25,
//    minimumPurchase: 50,
//    startDate: '01/06/2025',
//    expiration: 'date:30/06/2025'
//});

// 4. Never-expiring coupon:
// 15% off, no minimum purchase required, starts now, never expires

//await smallFunctions.createCoupon({
//    name: 'FOREVER15',
//    prefix: 'FOR',
//    discountType: 'percentage',
//    discountAmount: 15,
//    expiration: 'never'
//});

/////////////////////////
// TEMPLATE FUNCTIONS //
/////////////////////////

// Create new template
//templateFunctions.createNewTemplate();

// Rename template
//templateFunctions.renameTemplate('Y6Xqhp', 'New Template Name2');

// Get universal elements
//templateFunctions.getUniversalElements();

// Clone a template with a custom name and company | Template ID | Template Name | Company ID
//templateFunctions.cloneTemplate('TSfg7t', 'My Custom Template', 'ShNPvE');

// Clone with custom name only (uses default company context - BBB Marketing)
//templateFunctions.cloneTemplate('XUvKaN', 'Another Template');

// Get and save template data for inspection
//const templateData = await templateFunctions.getTemplateData('RQ78g2');
//import { writeFileSync } from 'fs';
//writeFileSync('template_data.json', JSON.stringify(templateData, null, 2));
//console.log('✅ Template data saved to template_data.json');

// Universal text replacement function (handles all replacements in one atomic operation)
//await templateFunctions.batchUpdateTextInTemplate('VxbiUp', [
//    { oldText: 'Newest alt text4', newText: 'Newest alt text4' },
//    { oldText: 'https://newestsite.com4', newText: 'https://newestsite.com4' },
//    { oldText: 'https://d3k81ch9hvuctc.cloudfront.net/company/S22rRA/images/5c0c6cd0-4472-4c96-9079-de88cac26a6a.png', newText: 'https://d3k81ch9hvuctc.cloudfront.net/company/SRsJn8/images/4b5c3ea4-d5b5-4a61-aba8-348fa4e6fbfa.jpeg' }
//]);

// Get all company templates
//const companyTemplates = await templateFunctions.getAllCompanyTemplates();
//console.log(JSON.stringify(companyTemplates, null, 2));

// test the template edit function
//import siliconWivesData from './Functions/siliconwives.com.json' assert { type: 'json' };
//const brand = siliconWivesData; // Just for testing. It will be replaced with the brand data from the database.
//emailTemplates.generateWF3(brand, 'RafPcu');

// Find blocks with 'feed_cols' attribute and add 'feed' attribute
//await templateFunctions.addAttributeToBlocks('SQpsdX', [
//   {
//     findAttribute: 'feed_cols',
//     addAttributes: {
//       "feed": "SHOP_POPULAR_ALL_CATEGORIES"
//     }
//   }
// ]);
