import * as flowFunctions from '../Functions/flowFunctions.js';

export async function createWelcomeFlow(flowName, templateIds) {
  // Get filter data and trigger info
  const filterData = await flowFunctions.getFilterData();
  const triggerFilter = await flowFunctions.getTriggerIdByName(filterData, "FlowFastAI: Subscribers");
  const placedOrderFilter = await flowFunctions.getTriggerIdByName(filterData, "Placed Order");

  // Create the flow with a list trigger and profile filter
  const flow = await flowFunctions.createAndConfigureFlow({
    name: flowName,
    triggerConfig: {
      customer_filter: "",
      has_customer_filter: false,
      has_trigger_filter: false,
      trigger_filter: "",
      trigger_group: triggerFilter.id,
      trigger_type: triggerFilter.triggerType
    },
    customerFilters: {
      stanzas: [
        {
          criteria: [ // Placed Order 0 Times Since Flow Start
            {
              type: "customer-statistic-value",
              operator: "eq-zero",
              timeframe: "flow-start",
              value: null,
              use_value: false,
              statistic: placedOrderFilter.id,
              timeframe_options: null
            }
          ]
        }
      ]
    }
  });


  // Create FFA user property
  const ffaProperty = await flowFunctions.createAndConfigureProfilePropertyUpdateAction(flow.pathId, [
    {
      operator: 'create',
      property_key: 'FFA',
      property_type: 'boolean',
      property_value: 'true'
    }
  ], null);

  // Email 1: Immediate
  const emailAction1 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, ffaProperty.actionId, {
    content: {
      name: "FFA | WF Email #1",
      templateId: templateIds['FFA | WF Email #1'],
      subject: "Welcome Aboard",
      previewText: "Here's 10% OFF to get you started right!"
    },
    settings: {
      ignore_throttling: true,
      enableUtmTracking: false
    }
  });

  // Wait 23 hours
  const timeDelay23h = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
    "allowed_days[]": [6,0,1,2,3,4,5],
    delay_unit_value: 23,
    delay_units: 'hours'
  }, emailAction1.actionId);

  // Email 2
  const emailAction2 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay23h.actionId, {
    content: {
      name: "FFA | WF Email #2",
      templateId: templateIds['FFA | WF Email #2'],
      subject: "A few customer favorites worth seeing",
      previewText: "Like something? Don't forget to use your welcome coupon!"
    },
    settings: {
      ignore_throttling: true,
      enableUtmTracking: false
    }
  });

  // Wait 22 hours
  const timeDelay22h = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
    "allowed_days[]": [6,0,1,2,3,4,5],
    delay_unit_value: 22,
    delay_units: 'hours'
  }, emailAction2.actionId);

  // Email 3
  const emailAction3 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay22h.actionId, {
    content: {
      name: "FFA | WF Email #3",
      templateId: templateIds['FFA | WF Email #3'],
      subject: "Welcome coupon expires soon",
      previewText: "Less than 3 hours remain..."
    },
    settings: {
      ignore_throttling: true,
      enableUtmTracking: false
    }
  });

  return flow;
}

// Example usage:
//await createWelcomeFlow("FFA | Welcome Flow Test", {
//  'FFA | WF Email #1': 'XUvKaN',
//  'FFA | WF Email #2': 'UB8bja',
//  'FFA | WF Email #3': 'Yg2GvB'
//});