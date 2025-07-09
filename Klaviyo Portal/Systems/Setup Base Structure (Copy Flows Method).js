// The Base Setup Function
import * as smallFunctions from '../Functions/smallFunctions.js';
import * as flowFunctions from '../Functions/flowFunctions.js';
import * as emailTemplates from '../Functions/templatesExport.js';
import * as listFunctions from '../Functions/listFunctions.js';
import * as templateFunctions from '../Functions/templateFunctions.js';

export async function setupBaseStructure(clientID, brand) {
    const track_time = true;
    let start_time;
    if (track_time) { start_time = new Date(); }

    // Step 1: Switch into the new client account
    await smallFunctions.changeClient(clientID);

    await smallFunctions.switchToClientSession(clientID);

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

    let emailIDs;
    try {
        emailIDs = await flowFunctions.getFlowEmailsIDs(emailNames, flowIDs);
        console.log('✅ Email IDs retrieved successfully');
        console.log('📋 Found emailIDs:', JSON.stringify(emailIDs, null, 2));
    } catch (error) {
        console.error('❌ Error in Step 8 - Getting flow email IDs:', error.message);
        console.error('📋 flowIDs object:', JSON.stringify(flowIDs, null, 2));
        console.error('📋 emailNames array:', JSON.stringify(emailNames, null, 2));
        throw new Error(`Failed to get flow email IDs: ${error.message}`);
    }

    // Step 9: For each email, change the dynamic content concurrently
    try {
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
        console.log('✅ All email templates generated successfully');
    } catch (error) {
        console.error('❌ Error in Step 9 - Email template generation:', error.message);
        console.error('📋 emailIDs object:', JSON.stringify(emailIDs, null, 2));
        throw new Error(`Email template generation failed: ${error.message}`);
    }

    // Step 10: Save all done emails as Templates
    try {
        await Promise.all(Object.entries(emailIDs).map(([emailName, emailID]) => 
            templateFunctions.cloneTemplate(emailID, emailName, clientID)
        ));
        console.log('✅ All templates cloned successfully');
    } catch (error) {
        console.error('❌ Error in Step 10 - Template cloning:', error.message);
        console.error('📋 emailIDs object:', JSON.stringify(emailIDs, null, 2));
        throw new Error(`Template cloning failed: ${error.message}`);
    }
    
    // Step 11: return to base Account
    await smallFunctions.changeClient('Flow Fast AI');

    if (track_time) {
      const end_time = new Date();
      const execution_time = end_time - start_time;
      console.log(`Execution time: ${(execution_time / 1000).toFixed(2)} seconds`);
    }

    // Return success result
    return {
        success: true,
        message: 'Base structure setup completed successfully',
        clientID,
        executionTime: track_time ? `${((new Date() - start_time) / 1000).toFixed(2)} seconds` : null,
        details: {
            flowsCreated: {
                count: baseFlows.length,
                flows: flowIDs
            },
            emailsProcessed: {
                count: emailNames.length,
                emails: emailIDs
            },
            couponsCreated: ['FFA_WF_10 (WELCOME10)', 'FFA_AC_15 (QUICK15)'],
            listsCreated: ['FlowFastAI: Subscribers'],
            templatesCreated: Object.keys(emailIDs).length
        }
    };
}

//setupBaseStructure('ShNPvE', 'crystal energy'); // crystal energy