import * as flowFunctions from '../Functions/flowFunctions.js';

export async function createAbandonedCartFlow(flowName, templateIds) {

// Unified flow creation and configuration
const filterData = await flowFunctions.getFilterData();
const trigger = await flowFunctions.getTriggerIdByName(filterData, "Checkout Started");
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

// 45-minute delay
const timeDelay45m = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
  "allowed_days[]": [6,0,1,2,3,4,5],
  delay_unit_value: 45,
  delay_units: 'minutes'
});

// FFA | AC Email #1
const emailAction = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay45m.actionId, {
  content: {
    name: "FFA | AC Email #1",
    templateId: templateIds['FFA | AC Email #1'],
    subject: "Don't forget your cart!",
    previewText: "You left something behind..."
  },
  settings: {
    ignore_throttling: true,
    enableUtmTracking: false
  }
});

// 23-hour delay
const timeDelay23h = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
  "allowed_days[]": [6,0,1,2,3,4,5],
  delay_unit_value: 23,
  delay_units: 'hours'
}, emailAction.actionId);

// FFA | AC Email #2
const emailAction2 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay23h.actionId, {
  content: {
    name: "FFA | AC Email #2",
    templateId: templateIds['FFA | AC Email #2'],
    subject: "It's on the house 🎁",
    previewText: "Your cart just got a massive upgrade"
  },
  settings: {
    ignore_throttling: true,
    enableUtmTracking: false
  }
});

// 22-hour delay
const timeDelay22h = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
  "allowed_days[]": [6,0,1,2,3,4,5],
  delay_unit_value: 22,
  delay_units: 'hours'
}, emailAction2.actionId);

// FFA | AC Email #3
const emailAction3 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay22h.actionId, {
  content: {
    name: "FFA | AC Email #3",
    templateId: templateIds['FFA | AC Email #3'],
    subject: "Less than 3 hours remain",
    previewText: "Save 15% OFF before your one-time discount expires..."
  },
  settings: {
    ignore_throttling: true,
    enableUtmTracking: false
  }
});

// 2-day delay - until 09:15:00, only on Monday-Friday
const timeDelay2d = await flowFunctions.createAndConfigureTimeDelayAction(flow.pathId, {
  delay_unit_value: 2,
  delay_units: 'days',
  sendTime: '09:15:00',
  specificDays: [0,1,2,3,4]
}, emailAction3.actionId);

// FFA | AC Email #4
const emailAction4 = await flowFunctions.createAndConfigureEmailAction(flow.pathId, timeDelay2d.actionId, {
  content: {
    name: "FFA | AC Email #4",
    templateId: templateIds['FFA | AC Email #4'],
    subject: "Is everything alright?",
    previewText: ""
  },
  settings: {
    ignore_throttling: true,
    enableUtmTracking: false
  }
});

  return flow;
}

//await createAbandonedCartFlow("FFA | AC Flow Test", {
//  'FFA | AC Email #1': 'XPAYGK',
//  'FFA | AC Email #2': 'YsC3jn',
//  'FFA | AC Email #3': 'UeKdFM',
//  'FFA | AC Email #4': 'Ssjkbi'
//});



