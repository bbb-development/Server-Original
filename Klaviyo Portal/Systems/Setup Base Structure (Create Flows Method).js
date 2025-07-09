// The Base Setup Function
import * as smallFunctions from '../Functions/smallFunctions.js';
import * as listFunctions from '../Functions/listFunctions.js';
import * as templateFunctions from '../Functions/templateFunctions.js';
import {createAbandonedCartFlow} from '../Functions/Generate Klaviyo Flows/Main/Abandoned Cart Flow Builder.js';
import {createBrowseAbandonedFlow} from '../Functions/Generate Klaviyo Flows/Main/Browse Abandoned Flow Builder.js';
import {createWelcomeFlow} from '../Functions/Generate Klaviyo Flows/Main/Welcome Flow Builder.js';
import { generateEmailByType } from '../Functions/Generate Klaviyo Flows/Main/klaviyoTemplatesBuilder.js';
import crystalenergy from '../Functions/Generate Klaviyo Flows/Misc/crystalenergy_updated_brand_data.json' with { type: 'json' };

export async function setupBaseStructure(clientID, brandData) {
    const track_time = true;
    let start_time;
    if (track_time) { start_time = new Date(); }
    
    // Step 1: Switch into the new client account
    await smallFunctions.changeClient(clientID);

    // Map template names, original IDs, and types together
    const templateConfigs = [
        { name: 'FFA | WF Email #1', id: 'SpZKLh', type: 'WF1' },
        { name: 'FFA | WF Email #2', id: 'SjnvqT', type: 'WF2' },
        { name: 'FFA | WF Email #3', id: 'Yf3Wdz', type: 'WF3' },
        { name: 'FFA | AC Email #1', id: 'RLpd9P', type: 'AC1' },
        { name: 'FFA | AC Email #2', id: 'X7qBvi', type: 'AC2' },
        { name: 'FFA | AC Email #3', id: 'QTQpvV', type: 'AC3' },
        { name: 'FFA | AC Email #4', id: 'XvJpat', type: 'AC4' },
        { name: 'FFA | BA Email #1', id: 'Rb3aEN', type: 'BA1' }
    ];

    // Prepare template cloning promises
    const templateClonePromises = templateConfigs.map(cfg =>
        templateFunctions.cloneTemplate(cfg.id, cfg.name, clientID).then(newId => ({
            ...cfg,
            newId
        }))
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
    // Now you have an array of { name, id, type, newId }

    // Step 3: For each email, change the dynamic content concurrently using the new template IDs
    await Promise.all(
        cloneResults.map(cfg =>
            generateEmailByType(cfg.type, brandData, cfg.newId)
        )
    );

    // Step 4: Create the flows
    const templateIds = Object.fromEntries(cloneResults.map(cfg => [cfg.name, cfg.newId]));
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

async function test() {
    const result = await setupBaseStructure('ShNPvE', crystalenergy);
    console.log(result);
}

//await test();