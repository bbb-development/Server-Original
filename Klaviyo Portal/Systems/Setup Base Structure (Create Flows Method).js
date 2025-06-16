// The Base Setup Function
import * as smallFunctions from '../Functions/smallFunctions.js';
import * as emailTemplates from '../Functions/templatesExport.js';
import * as listFunctions from '../Functions/listFunctions.js';
import * as templateFunctions from '../Functions/templateFunctions.js';
import {createAbandonedCartFlow} from '../Flows/Abandoned Cart Flow Builder.js';
import {createBrowseAbandonedFlow} from '../Flows/Browse Abandoned Flow Builder.js';
import {createWelcomeFlow} from '../Flows/Welcome Flow Builder.js';

export async function setupBaseStructure(clientID, brandData) {
    const track_time = true;
    let start_time;
    if (track_time) { start_time = new Date(); }
    
    // Step 1: Switch into the new client account
    await smallFunctions.changeClient(clientID);

    // Map template names to original IDs
    const templateNamesToIds = {
        'FFA | WF Email #1': 'SpZKLh',
        'FFA | WF Email #2': 'SjnvqT',
        'FFA | WF Email #3': 'Yf3Wdz',
        'FFA | AC Email #1': 'RLpd9P',
        'FFA | AC Email #2': 'X7qBvi',
        'FFA | AC Email #3': 'QTQpvV',
        'FFA | AC Email #4': 'XvJpat',
        'FFA | BA Email #1': 'Rb3aEN',
    };
    let templateIds = { ...templateNamesToIds };

    // Prepare template cloning promises
    const templateClonePromises = Object.entries(templateNamesToIds).map(([name, originalId]) =>
        templateFunctions.cloneTemplate(originalId, name, clientID).then(newId => [name, newId])
    );

    // Run all setup steps concurrently
    const results = await Promise.all([
        listFunctions.createList('FlowFastAI: Subscribers'),
        smallFunctions.createCoupon({
            name: 'FFA_WF_10',
            prefix: 'WELCOME10',
            discountType: 'percentage',
            discountAmount: 10,
            minimumPurchase: false,
            expiration: 'hours:48',
        }),
        smallFunctions.createCoupon({
            name: 'FFA_AC_15',
            prefix: 'QUICK15',
            discountType: 'percentage',
            discountAmount: 15,
            minimumPurchase: false,
            expiration: 'hours:72',
        }),
        ...templateClonePromises
    ]);

    // Remap templateIds to new IDs from the results
    const cloneResults = results.slice(3); // first 3 are list/coupons
    templateIds = Object.fromEntries(cloneResults);    

    // Step 3: For each email, change the dynamic content concurrently using the new template IDs
    await Promise.all([
        emailTemplates.generateBA1(brandData, templateIds['FFA | BA Email #1']),
        emailTemplates.generateAC1(brandData, templateIds['FFA | AC Email #1']),
        emailTemplates.generateAC2(brandData, templateIds['FFA | AC Email #2']),
        emailTemplates.generateAC3(brandData, templateIds['FFA | AC Email #3']),
        emailTemplates.generateAC4(brandData, templateIds['FFA | AC Email #4']),
        emailTemplates.generateWF1(brandData, templateIds['FFA | WF Email #1']),
        emailTemplates.generateWF2(brandData, templateIds['FFA | WF Email #2']),
        emailTemplates.generateWF3(brandData, templateIds['FFA | WF Email #3'])
    ]);

    // Step 4: Create the flows
    const flowResults = await Promise.all([
        createWelcomeFlow("FlowFastAI | Welcome Flow", templateIds),
        createAbandonedCartFlow("FlowFastAI | Abandoned Cart Flow", templateIds),
        createBrowseAbandonedFlow("FlowFastAI | Browse Abandoned Flow", templateIds)
    ]);

    // Step 5: Switch back to the main BBB account
    await smallFunctions.changeClient('BBB Marketing');

    let execution_time = null;
    if (track_time) {
      const end_time = new Date();
      execution_time = ((end_time - start_time) / 1000).toFixed(2) + ' seconds';
      console.log(`Execution time: ${execution_time}`);
    }

    // Prepare details for return
    const flowNames = ["FlowFastAI | Welcome Flow", "FlowFastAI | Abandoned Cart Flow", "FlowFastAI | Browse Abandoned Flow"];
    const flowIDs = flowResults.map(r => (r && (r.id || r.flowId)) ? (r.id || r.flowId) : null);
    const flowsCreatedMap = {};
    flowNames.forEach((name, idx) => {
      flowsCreatedMap[name] = flowIDs[idx];
    });
    const emailNames = Object.keys(templateIds);
    const emailIDs = Object.values(templateIds);
    const emailsProcessedMap = {};
    emailNames.forEach((name, idx) => {
      emailsProcessedMap[name] = emailIDs[idx];
    });
    const couponsCreated = ['FFA_WF_10 (WELCOME10)', 'FFA_AC_15 (QUICK15)'];
    const listsCreated = ['FlowFastAI: Subscribers'];
    const templatesCreated = emailNames.length;

    // Return success result
    return {
        success: true,
        message: 'Base structure setup completed successfully',
        clientID,
        executionTime: execution_time,
        details: {
            flowsCreated: flowsCreatedMap,
            emailsProcessed: emailsProcessedMap,
            couponsCreated,
            listsCreated,
            templatesCreated
        }
    };
}