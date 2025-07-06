import * as flowFunctions from '../../flowFunctions.js';

export async function createBrowseAbandonedFlow(flowName, templateIds) {
  // Unified flow creation and configuration
  const filterData = await flowFunctions.getFilterData();
  const trigger = await flowFunctions.getTriggerIdByName(filterData, "Viewed Product");
  const checkoutStartedFilter = await flowFunctions.getTriggerIdByName(filterData, "Checkout Started");
  const placedOrderFilter = await flowFunctions.getTriggerIdByName(filterData, "Placed Order");

  const flow = await flowFunctions.createAndConfigureFlow({
    name: flowName,
    triggerConfig: {
      customer_filter: "",
      has_customer_filter: false,
      has_trigger_filter: false,
      trigger_filter: "",
      trigger_statistic: trigger.id,
      trigger_type: trigger.triggerType
    },
    customerFilters: {
      stanzas: [
        {
          criteria: [ // Checkout Started 0 Times Since Flow Start
            {
              type: "customer-statistic-value",
              operator: "eq-zero",
              timeframe: "flow-start",
              value: null,
              use_value: false,
              statistic: checkoutStartedFilter.id,
              timeframe_options: null
            }
          ]
        },
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
        },
        {
          criteria: [ // Not Been In Flow Since The Last 30 Days
            {
              type: "customer-in-flow",
              timeframe: "in-the-last",
              timeframe_options: {
                quantity: 30,
                units: "day"
              }
            }
          ]
        }
      ]
    }
  });

  // 1-hour delay
  const timeDelay1h = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
    "allowed_days[]": [6,0,1,2,3,4,5],
    delay_unit_value: 1,
    delay_units: 'hours'
  });

  // FFA | BA Email #1
  const emailAction = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay1h.actionId, {
    content: {
      name: "FFA | BA Email #1",
      templateId: templateIds['FFA | BA Email #1'],
      subject: "Have another look",
      previewText: "It's still available and ready to ship to you!"
    },
    settings: {
      ignore_throttling: true,
      enableUtmTracking: false
    }
  });

  // You can add more steps here if you want a multi-email sequence, similar to the abandoned cart flow.

  return flow;
}

// Example usage:
//await createBrowseAbandonedFlow("FFA | BA Flow Test", {
//  'FFA | BA Email #1': 'Vu79Tf'
//});