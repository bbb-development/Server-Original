// The Base Setup Function
import * as smallFunctions from '../Functions/smallFunctions.js';
import * as flowFunctions from '../Functions/flowFunctions.js';
import * as emailTemplates from '../Functions/templatesExport.js';
import * as listFunctions from '../Functions/listFunctions.js';
import * as templateFunctions from '../Functions/templateFunctions.js';
import { readFile } from 'fs/promises';
const siliconWivesData = JSON.parse(
  await readFile(new URL('../Functions/siliconwives.com.json', import.meta.url))
);
const brand = siliconWivesData; // Just for testing. It will be replaced with the brand data from the database.

export async function setupBaseStructure(clientID) {
    const track_time = true;
    let start_time;
    if (track_time) { start_time = new Date(); }

    // Step 1: Switch into the new client account
    await smallFunctions.changeClient(clientID);

    // Execute steps 2 and 3 concurrently
    await Promise.all([

        // Step 2: Create the FlowFastAI: Subscribers list
        listFunctions.createList('FlowFastAI: Subscribers'),
        
        // Step 3: Create the WF and AC flow coupons concurrently
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
        })
    ]);

    // Step 4: Switch back to the main BBB account
    await smallFunctions.changeClient('BBB Marketing');

    // Step 5: Copy all flows into the client account
    const baseFlows = [
        { id: 'UPsFTp', name: 'FlowFastAI | Welcome Flow' },
        { id: 'Xir9UH', name: 'FlowFastAI | Abandoned Cart Flow' },
        { id: 'SEVyvg', name: 'FlowFastAI | Browse Abandoned Flow' }
    ];

    await Promise.all(baseFlows.map(flow => 
        flowFunctions.crossAccountFlowClone(
            flow.id,
            clientID,
            flow.name
        )
    ));

    // Step 6: Switch back to the new client account
    await smallFunctions.changeClient(clientID);

    // Step 7: Find all new flow IDs by their flow name
    const flowIDs = await flowFunctions.getBaseFlowsIDs(baseFlows.map(flow => flow.name));

    // Step 8: Find all the email IDs in the flow
    const emailNames = [
        'FFA | WF Email #1', 
        'FFA | WF Email #2', 
        'FFA | WF Email #3', 
        'FFA | AC Email #1', 
        'FFA | AC Email #2', 
        'FFA | AC Email #3', 
        'FFA | AC Email #4', 
        'FFA | BA Email #1', 
    ];

    const emailIDs = await flowFunctions.getFlowEmailsIDs(emailNames, flowIDs);

    // Step 9: For each email, change the dynamic content concurrently
    await Promise.all([
        emailTemplates.generateBA1(brand, emailIDs['FFA | BA Email #1']),
        emailTemplates.generateAC1(brand, emailIDs['FFA | AC Email #1']),
        emailTemplates.generateAC2(brand, emailIDs['FFA | AC Email #2']),
        emailTemplates.generateAC3(brand, emailIDs['FFA | AC Email #3']),
        emailTemplates.generateAC4(brand, emailIDs['FFA | AC Email #4']),
        emailTemplates.generateWF1(brand, emailIDs['FFA | WF Email #1']),
        emailTemplates.generateWF2(brand, emailIDs['FFA | WF Email #2']),
        emailTemplates.generateWF3(brand, emailIDs['FFA | WF Email #3'])
    ]);

    // Step 10: Save all done emails as Templates
    await Promise.all(Object.entries(emailIDs).map(([emailName, emailID]) => 
        templateFunctions.cloneTemplate(emailID, emailName, clientID)
    ));

    if (track_time) {
      const end_time = new Date();
      const execution_time = end_time - start_time;
      console.log(`Execution time: ${(execution_time / 1000).toFixed(2)} seconds`);
    }
}

setupBaseStructure('ShNPvE'); // crystal energy