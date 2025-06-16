import axios from 'axios';
import FormData from 'form-data';

const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

// GET ALL FLOWS
export async function getAllFlows() {
  let allFlows = [];
  let page = 1;
  let keepGoing = true;

  while (keepGoing) {
    const url = `${KLAVIYO_URL}/ajax/flows/list/?archived=false&inline_recommendations=false&order_asc=false&order_by=updated&page=${page}&timeframe_key=last_7_days`;
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url
    });
    const flows = response.data.flows || [];
    allFlows = allFlows.concat(flows);
    if (flows.length === 0) {
      keepGoing = false;
    } else {
      page++;
    }
  }
  return { flows: allFlows };
}

// GET ALL MESSAGES FROM A FLOW
export async function getFlowMessages(flowId) {
  try {
    console.log(`🔍 Fetching messages for flow ID: ${flowId}...`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/flow/${flowId}`
    });
    
    //console.log(`✅ Flow messages for ${flowId}:`, JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching flow messages for ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET UNIQUE ELEMENTS FROM A FLOW
export async function getUniqueElements(flowId) {
  try {
    //console.log(`🔍 Fetching unique elements for flow ID: ${flowId}...`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/flows/${flowId}/unique-elements`
    });
    
    //console.log(`✅ Unique elements fetched for flow ${flowId}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching unique elements for flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET FLOW CLONE MAPPING CANDIDATE ELEMENTS
export async function getFlowCloneMappingCandidates(flowId, companyId) {
  try {
    console.log(`🔍 Fetching clone mapping candidates for flow ID: ${flowId}, company: ${companyId}`);
    
    const requestUrl = `${KLAVIYO_URL}/ajax/flows/${flowId}/clone-mapping-candidate-elements?company_ids=${companyId}`;
    console.log(`📡 Request URL: ${requestUrl}`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: requestUrl
    });
    
    console.log(`✅ Clone mapping candidates fetched for flow ${flowId}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching clone mapping candidates for flow ${flowId}:`, error.message);
    console.error(`🎯 Flow ID: ${flowId}`);
    console.error(`🏢 Company ID: ${companyId}`);
    console.error(`📡 Full URL: ${KLAVIYO_URL}/ajax/flows/${flowId}/clone-mapping-candidate-elements?company_ids=${companyId}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText || 'No status text'}`);
      console.error(`   Headers:`, JSON.stringify(error.response.headers, null, 2));
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.request) {
      console.error(`   Request Details:`, {
        method: error.request.method,
        url: error.request.url,
        headers: error.request.headers
      });
    }
    
    throw error;
  }
}

// GET FLOW DATA (with beta flag)
export async function getFlowData(flowId) {
  try {
    console.log(`🔍 Fetching flow data for flow ID: ${flowId}...`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/flow/${flowId}?beta=true`
    });
    
    console.log(`✅ Flow data fetched for flow ${flowId}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching flow data for flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// CHECK IF ALL UNIQUE ELEMENTS ARE AVAILABLE FOR CLONING
export async function checkUniqueElementsForCloning(flowId, companyId) {
  try {
    console.log(`🔍 Checking unique elements for flow ${flowId} against company ${companyId}...`);
    
    // Make both calls concurrently
    const [uniqueElementsResponse, mappingCandidatesResponse] = await Promise.all([
      getUniqueElements(flowId),
      getFlowCloneMappingCandidates(flowId, companyId)
    ]);
    
    const uniqueElements = uniqueElementsResponse.unique_elements || [];
    const candidateElements = mappingCandidatesResponse.company_id_to_candidate_elements[companyId];
    
    if (!candidateElements) {
      console.error(`❌ No candidate elements found for company ${companyId}`);
      return { allPresent: false, missingElements: uniqueElements.map(e => e.name) };
    }
    
    //console.log(`📋 Found ${uniqueElements.length} unique elements to check`);
    
    const missingElements = [];
    
    // Check each unique element
    for (const uniqueElement of uniqueElements) {
      const { type, name } = uniqueElement;
      let found = false;
      
      // Search in the appropriate category based on type
      if (type === 'metric' && candidateElements.metrics) {
        found = candidateElements.metrics.some(metric => metric.name === name);
      } else if (type === 'list' && candidateElements.lists) {
        found = candidateElements.lists.some(list => list.name === name);
      } else if (type === 'segment' && candidateElements.segments) {
        found = candidateElements.segments.some(segment => segment.name === name);
      } else if (type === 'profile_property' && candidateElements.profile_properties) {
        found = candidateElements.profile_properties.some(prop => prop.name === name);
      } else if (type === 'predictive_analytic' && candidateElements.predictive_analytics) {
        found = candidateElements.predictive_analytics.some(pred => pred.name === name);
      }
      
      if (found) {
        console.log(`✅ Found: ${name} (${type}) ID: ${uniqueElement.id}`);
      } else {
        console.log(`❌ Missing: ${name} (${type}) ID: ${uniqueElement.id}`);
        missingElements.push(name);
      }
    }
    
    // Log final result
    if (missingElements.length === 0) {
      console.log(`✅ All unique elements present!`);
      return { allPresent: true, missingElements: [] };
    } else {
      console.error(`❌ ${missingElements.length} element(s) missing: ${missingElements.join(', ')}`);
      return { allPresent: false, missingElements };
    }
    
  } catch (error) {
    console.error(`❌ Error checking unique elements for flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// CROSS ACCOUNT FLOW CLONE
export async function crossAccountFlowClone(flowId, companyId, clonedFlowName) {
  try {
    console.log(`🔄 Starting cross-account clone of flow ${flowId} to company ${companyId}...`);
    
    // First, check if all unique elements are available for cloning
    const checkResult = await checkUniqueElementsForCloning(flowId, companyId);
    
    if (!checkResult.allPresent) {
      console.error(`❌ Cannot clone flow - missing elements: ${checkResult.missingElements.join(', ')}`);
      return { 
        success: false, 
        error: 'Missing required elements', 
        missingElements: checkResult.missingElements 
      };
    }
    
    console.log(`📋 Building element mappings for clone...`);
    
    // Get the data we need for mapping (we'll make fresh calls to ensure latest data)
    const [uniqueElementsResponse, mappingCandidatesResponse] = await Promise.all([
      getUniqueElements(flowId),
      getFlowCloneMappingCandidates(flowId, companyId)
    ]);
    
    const uniqueElements = uniqueElementsResponse.unique_elements || [];
    const candidateElements = mappingCandidatesResponse.company_id_to_candidate_elements[companyId];
    
    // Build the mapping preferences
    const mappingPreferences = {
      lists: {},
      segments: {},
      metrics: {},
      profile_properties: {},
      predictive_analytics: {},
      name: clonedFlowName
    };
    
    // Map each unique element to its corresponding target element
    for (const uniqueElement of uniqueElements) {
      const { type, id, name } = uniqueElement;
      let targetElement = null;
      
      // Find the corresponding element in the target company
      if (type === 'metric' && candidateElements.metrics) {
        targetElement = candidateElements.metrics.find(metric => metric.name === name);
        if (targetElement) {
          mappingPreferences.metrics[id] = targetElement.id;
          console.log(`🔗 Mapped metric: ${name} (${id} → ${targetElement.id})`);
        }
      } else if (type === 'list' && candidateElements.lists) {
        targetElement = candidateElements.lists.find(list => list.name === name);
        if (targetElement) {
          mappingPreferences.lists[id] = targetElement.id;
          console.log(`🔗 Mapped list: ${name} (${id} → ${targetElement.id})`);
        }
      } else if (type === 'segment' && candidateElements.segments) {
        targetElement = candidateElements.segments.find(segment => segment.name === name);
        if (targetElement) {
          mappingPreferences.segments[id] = targetElement.id;
          console.log(`🔗 Mapped segment: ${name} (${id} → ${targetElement.id})`);
        }
      } else if (type === 'profile_property' && candidateElements.profile_properties) {
        targetElement = candidateElements.profile_properties.find(prop => prop.name === name);
        if (targetElement) {
          mappingPreferences.profile_properties[id] = targetElement.id;
          console.log(`🔗 Mapped profile property: ${name} (${id} → ${targetElement.id})`);
        }
      } else if (type === 'predictive_analytic' && candidateElements.predictive_analytics) {
        targetElement = candidateElements.predictive_analytics.find(pred => pred.name === name);
        if (targetElement) {
          mappingPreferences.predictive_analytics[id] = targetElement.id;
          console.log(`🔗 Mapped predictive analytic: ${name} (${id} → ${targetElement.id})`);
        }
      }
    }
    
    // Build the clone request payload
    const payload = {
      to_company_ids: [companyId],
      mapping_preferences_map: {
        [companyId]: mappingPreferences
      }
    };
    
    console.log(`🚀 Executing cross-account clone...`);
    console.log(`📝 Clone name: "${clonedFlowName}"`);
    
    // Make the clone request
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/ajax/flows/${flowId}/cross-account-clone`,
      data: payload
    });
    
    if (response.data?.task_id) {
      const taskId = response.data.task_id;
      console.log(`⏳ Clone task started with ID: ${taskId}. Waiting for completion...`);
      
      // Poll for task completion
      let attempts = 0;
      const maxAttempts = 60; // Max 5 minutes (60 * 5 seconds)
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
        
        try {
          const statusResponse = await axios.post(`${SERVER_URL}/request`, {
            method: 'GET',
            url: `${KLAVIYO_URL}/ajax/dtt-task/status/FlowCrossAccountCloningParent/${taskId}`
          });
          
          const statusData = statusResponse.data?.data?.attributes;
          
          if (statusData?.status_detail?.[companyId]?.completion_status === 'success') {
            console.log(`✅ Flow cloned successfully to company ${companyId}! (Task completed after ${attempts * 5} seconds)`);
            return {
              success: true,
              taskId: taskId,
              response: statusResponse.data,
              mappings: mappingPreferences,
              completionTime: attempts * 5
            };
          } else if (statusData?.status_detail?.[companyId]?.completion_status === 'failure') {
            console.error(`❌ Flow clone failed for company ${companyId}`);
            return {
              success: false,
              taskId: taskId,
              response: statusResponse.data,
              mappings: mappingPreferences,
              error: 'Clone task failed'
            };
          } else {
            console.log(`⏳ Clone in progress... (${attempts * 2}s elapsed)`);
          }
        } catch (statusError) {
          console.error(`❌ Error checking task status:`, statusError.message);
          // Continue polling despite status check errors
        }
      }
      
      // Timeout reached
      console.error(`❌ Clone task timed out after ${maxAttempts * 5} seconds`);
      return {
        success: false,
        taskId: taskId,
        error: 'Clone task timed out',
        mappings: mappingPreferences
      };
      
    } else {
      console.error(`❌ Failed to start clone task - no task ID received`);
      console.error('Clone response:', response.data);
      return {
        success: false,
        response: response.data,
        mappings: mappingPreferences,
        error: 'No task ID received'
      };
    }
    
  } catch (error) {
    console.error(`❌ Error cloning flow ${flowId} to company ${companyId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET BASE FLOWS IDS BY NAME
export async function getBaseFlowsIDs(flowNames) {
  try {
    // Ensure flowNames is an array
    const flowNamesArray = Array.isArray(flowNames) ? flowNames : [flowNames];
    
    console.log(`🔍 Searching for flow IDs for: ${flowNamesArray.join(', ')}`);
    
    // Get all flows data
    const flowsData = await getFlows();
    const flows = flowsData.flows || [];
    
    console.log(`📋 Found ${flows.length} total flows to search through`);
    
    // Create result object to store flow name -> ID mappings
    const result = {};
    
    // Search for each flow name
    for (const flowName of flowNamesArray) {
      const matchingFlow = flows.find(flow => flow.name === flowName);
      
      if (matchingFlow) {
        result[flowName] = matchingFlow.id;
        console.log(`✅ Found flow: "${flowName}" with ID: ${matchingFlow.id}`);
      } else {
        result[flowName] = null;
        console.log(`❌ Flow not found: "${flowName}"`);
      }
    }
    
    // Log summary
    const foundCount = Object.values(result).filter(id => id !== null).length;
    const totalCount = flowNamesArray.length;
    console.log(`📊 Summary: Found ${foundCount}/${totalCount} flows`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error getting flow IDs:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET FLOW EMAILS IDS BY NAME
export async function getFlowEmailsIDs(emailNames, flowIdsResult) {
  try {
    // Ensure emailNames is an array
    const emailNamesArray = Array.isArray(emailNames) ? emailNames : [emailNames];
    const isInputArray = Array.isArray(emailNames);
    
    console.log(`🔍 Searching for email IDs for: ${emailNamesArray.join(', ')}`);
    
    // Get flow IDs from the result object (filter out null values)
    const validFlowIds = Object.values(flowIdsResult).filter(id => id !== null);
    
    if (validFlowIds.length === 0) {
      console.error('❌ No valid flow IDs provided');
      return isInputArray ? {} : null;
    }
    
    console.log(`📋 Fetching messages from ${validFlowIds.length} flows concurrently...`);
    
    // Call getFlowMessages for all flow IDs concurrently
    const flowMessagesPromises = validFlowIds.map(flowId => 
      getFlowMessages(flowId).catch(error => {
        console.error(`❌ Error fetching messages for flow ${flowId}:`, error.message);
        return null; // Return null for failed requests
      })
    );
    
    const flowMessagesResults = await Promise.all(flowMessagesPromises);
    
    // Create result object to store email name -> ID mappings
    const result = {};
    
    // Initialize all email names with null
    for (const emailName of emailNamesArray) {
      result[emailName] = null;
    }
    
    // Search through all flow messages for matching email names
    for (let i = 0; i < flowMessagesResults.length; i++) {
      const flowData = flowMessagesResults[i];
      const flowId = validFlowIds[i];
      
      if (!flowData || !flowData.data || !flowData.data.flow) {
        console.log(`⚠️ No valid data for flow ${flowId}`);
        continue;
      }
      
      const paths = flowData.data.flow.paths || {};
      
      // Search through all paths and actions
      for (const pathId in paths) {
        const path = paths[pathId];
        const actions = path.actions || {};
        
        for (const actionId in actions) {
          const action = actions[actionId];
          
          // Check if this is a send_message action (type 4) with a message
          if (action.type === 4 && action.message && action.message.name) {
            const messageName = action.message.name;
            const messageTemplateId = action.message.template;
            
            // Check if this message name matches any of our target email names
            for (const emailName of emailNamesArray) {
              if (messageName === emailName) {
                result[emailName] = messageTemplateId;
                console.log(`✅ Found email: "${emailName}" with ID: ${messageTemplateId} in flow ${flowId}`);
                break;
              }
            }
          }
        }
      }
    }
    
    // Log summary
    const foundCount = Object.values(result).filter(id => id !== null).length;
    const totalCount = emailNamesArray.length;
    console.log(`📊 Summary: Found ${foundCount}/${totalCount} emails`);
    
    // Log missing emails
    const missingEmails = Object.entries(result)
      .filter(([name, id]) => id === null)
      .map(([name]) => name);
    
    if (missingEmails.length > 0) {
      console.log(`❌ Missing emails: ${missingEmails.join(', ')}`);
    }
    
    // Return single ID if input was single string, otherwise return object
    if (!isInputArray && emailNamesArray.length === 1) {
      return result[emailNamesArray[0]];
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error getting email IDs:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// DELETE FLOW(S)
export async function deleteFlow(flowIds) {
  try {
    // Ensure flowIds is an array
    const flowIdsArray = Array.isArray(flowIds) ? flowIds : [flowIds];
    const isInputArray = Array.isArray(flowIds);
    
    console.log(`🗑️ Deleting ${flowIdsArray.length} flow(s): ${flowIdsArray.join(', ')}`);
    
    // Delete all flows concurrently
    const deletePromises = flowIdsArray.map(async (flowId) => {
      try {
        console.log(`🗑️ Deleting flow ID: ${flowId}...`);
        
        const response = await axios.post(`${SERVER_URL}/request`, {
          method: 'POST',
          url: `${KLAVIYO_URL}/flow/${flowId}/delete`
        });
        
        console.log(`✅ Flow ${flowId} deleted successfully`);
        return {
          flowId,
          success: true,
          data: response.data
        };
        
      } catch (error) {
        console.error(`❌ Error deleting flow ${flowId}:`, error.message);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Status Text: ${error.response.statusText || 'No status text'}`);
          console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return {
          flowId,
          success: false,
          error: error.message,
          details: error.response?.data
        };
      }
    });
    
    const results = await Promise.all(deletePromises);
    
    // Log summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    if (successCount > 0) {
      console.log(`✅ Successfully deleted ${successCount} flow(s)`);
    }
    if (failedCount > 0) {
      console.error(`❌ Failed to delete ${failedCount} flow(s)`);
      const failedIds = results.filter(r => !r.success).map(r => r.flowId);
      console.error(`   Failed flows: ${failedIds.join(', ')}`);
    }
    
    // Return single result if input was single string, otherwise return array
    if (!isInputArray && flowIdsArray.length === 1) {
      const result = results[0];
      if (result.success) {
        return result.data;
      } else {
        throw new Error(`Failed to delete flow ${result.flowId}: ${result.error}`);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ Error in deleteFlow function:`, error.message);
    throw error;
  }
}

export async function deleteAllExceptSomeFlows(excludeIds) {

  // Get all flows
  const flowsData = await flowFunctions.getAllFlows();
  const flows = flowsData.flows || [];

  // Filter out the flows to keep
  const toDelete = flows
    .map(flow => flow.id)
    .filter(id => !excludeIds.includes(id));

  if (toDelete.length === 0) {
    console.log('No flows to delete.');
    return [];
  }

  // Delete the flows
  const results = await deleteFlow(toDelete);
  return results;
}

// CLONE FLOW
export async function cloneFlow({ flowId, destinationAccount, name, trigger }) {
  try {
    console.log(`🌀 Cloning flow ID: ${flowId} to account: ${destinationAccount} with name: ${name} and trigger: ${trigger}`);
    const formData = new URLSearchParams({
      destination_account: destinationAccount,
      name,
      trigger
    });
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/flow/${flowId}/clone`,
      data: formData.toString()
    });
    console.log(`✅ Flow ${flowId} cloned successfully`);
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`❌ Error cloning flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText || 'No status text'}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// CREATE FLOW
export async function createFlow(name) {
  try {
    console.log(`🆕 Creating flow with name: ${name}`);
    const formData = new URLSearchParams({
      name,
      trigger_type: 2
    });

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/ajax/flows/create`,
      data: formData.toString(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data?.data?.flow_id) {
      const flowId = response.data.data.flow_id;
      console.log(`Flow Created: ${name} (ID: ${flowId})`);
      console.log('Flow Link: https://www.klaviyo.com/flow/' + flowId + '/edit');

      // Get the flow data to find the path ID
      const flowData = await getFlowMessages(flowId);
      const pathId = flowData?.data?.flow?.paths ? Object.keys(flowData.data.flow.paths)[0] : null;

      return {
        flowId,
        pathId
      };
    } else {
      console.error('Failed to create flow - No flow_id in response');
      console.error('Response:', JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Failed to create flow:', error);
    return null;
  }
}

// GET FILTER BUILDER DATA
export async function getFilterData() {
  try {
    const url = `${KLAVIYO_URL}/ajax/data/filter-builder/bootstrap`;
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url
    });
    if (response.data) {
      //console.log('Filter Builder Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.error('Failed to get filter builder data');
      console.error('Response:', JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Failed to get filter builder data:', error);
    return null;
  }
}

// GET TRIGGER ID FROM NAME
export async function getTriggerIdByName(filterData, triggerName) {
  if (!filterData?.data) {
    console.error('Invalid filter data structure');
    return null;
  }

  // Check statistics first
  if (filterData.data.statistics) {
    const statTrigger = filterData.data.statistics.find(stat =>
      stat.name.toLowerCase() === triggerName.toLowerCase()
    );
    if (statTrigger) {
      //console.log(`Found trigger "${triggerName}" in statistics with ID: ${statTrigger.id}`);
      return {
        id: statTrigger.id,
        type: 'statistic',
        triggerType: '0',
        data: statTrigger
      };
    }
  }

  // Check groups if not found in statistics
  if (filterData.data.groups) {
    const groupTrigger = filterData.data.groups.find(group =>
      group.name.toLowerCase() === triggerName.toLowerCase()
    );
    if (groupTrigger) {
      //console.log(`Found trigger "${triggerName}" in groups with ID: ${groupTrigger.id}`);
      return {
        id: groupTrigger.id,
        type: 'group',
        triggerType: '1',
        data: groupTrigger
      };
    }
  }

  // Check segments if not found in groups
  if (filterData.data.segments) {
    const segmentTrigger = filterData.data.segments.find(segment =>
      segment.name.toLowerCase() === triggerName.toLowerCase()
    );
    if (segmentTrigger) {
      //console.log(`Found trigger "${triggerName}" in segments with ID: ${segmentTrigger.id}`);
      return {
        id: segmentTrigger.id,
        type: 'segment',
        triggerType: '1',
        data: segmentTrigger
      };
    }
  }

  console.error(`Trigger "${triggerName}" not found in statistics, groups, or segments`);
  return null;
}

// CONFIGURE FLOW
export async function configureFlow(flowId, bodyVars) {
  try {
    const url = `${KLAVIYO_URL}/ajax/flow/${flowId}/configure`;

    // Encode the bodyVars object as application/x-www-form-urlencoded
    const data = new URLSearchParams(bodyVars).toString();

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Error configuring flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// SET CUSTOMER FILTERS FOR FLOW
export async function setFlowCustomerFilters(flowId, filtersObj) {
  try {
    const url = `${KLAVIYO_URL}/ajax/flow/${flowId}/customer-filters`;
    // Encode the filters object as a JSON string, then as form-urlencoded
    const data = new URLSearchParams({
      filters: JSON.stringify(filtersObj)
    }).toString();

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'accept': 'application/json, text/plain, */*'
        // Add more headers if needed
      }
    });
    if (response.data.success === true) {
      console.log('Customer filters set successfully');
    } else {
      console.error('Failed to set customer filters');
      console.error('Response:', JSON.stringify(response, null, 2));
    } 
    return response.data;
  } catch (error) {
    console.error(`❌ Error setting customer filters for flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// ADD ACTION TO FLOW PATH
export async function addAction({ pathId, actionType, previous_action_id }) {
  try {
    //console.log(`➕ Adding action to path ID: ${pathId} (type: ${actionType})...`);
    const url = `${KLAVIYO_URL}/ajax/flow/path/${pathId}/action/add`;
    const dataObj = {
      action_type: actionType,
      pathId: pathId
    };
    if (previous_action_id) dataObj.previous_action_id = previous_action_id;
    const data = new URLSearchParams(dataObj).toString();

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data,
      withCredentials: true
    });

    if (response.data?.success === false) {
      throw new Error(`Failed to add action: ${JSON.stringify(response.data)}`);
    }
    const actionId = response.data?.data?.action_id;
    let messageId = null;

    // If this is a send_message action, try to extract the messageId from the response
    if (actionType === 'send_message' && response.data?.data?.paths) {
      const paths = response.data.data.paths;
      for (const pathData of Object.values(paths)) {
        if (pathData.actions && pathData.actions[actionId] && pathData.actions[actionId].message) {
          messageId = pathData.actions[actionId].message.id;
          break;
        }
      }
    }

    //console.log('✅ Action added:', JSON.stringify(response.data, null, 2));
    console.log(`✅ Action ${actionType} added to flow path ${pathId}`);
    return { actionId, messageId, ...response.data };
  } catch (error) {
    console.error(`❌ Error adding action to path ${pathId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

/**
 * configureTimeDelay({ actionId, formData })
 *
 * Supports advanced options for day-based delays:
 * - If delay_units is days (0 or 'days'), you can provide:
 *   - sendTime: string (e.g., '14:00') to set a specific time of day
 *   - specificDays: array of numbers (0=Sunday, 6=Saturday) to restrict to certain days
 *   - timezone: string (defaults to 'customer')
 *
 * Example formData for days:
 * {
 *   delay_unit_value: 2,
 *   delay_units: 'days',
 *   sendTime: '14:00',
 *   specificDays: [1,3,5],
 *   timezone: 'Europe/London'
 * }
 */
export async function configureTimeDelay({ actionId, formData }) {
  try {
    console.log(`⏳ Configuring time delay for action ID: ${actionId}...`);
    const klaviyoUrl = `${KLAVIYO_URL}/ajax/flow/action/${actionId}/timing`;
    const proxyUrl = `${SERVER_URL}/raw-proxy`;

    // Map string delay_units to numeric values
    const delayUnitMap = {
      'days': 0,
      'hours': 1,
      'minutes': 3
    };
    if (formData && typeof formData.delay_units === 'string') {
      const mapped = delayUnitMap[formData.delay_units.toLowerCase()];
      if (mapped !== undefined) {
        formData.delay_units = mapped;
      } else {
        throw new Error(`Invalid delay_units string: ${formData.delay_units}`);
      }
    }

    // Build FormData for multipart/form-data
    const form = new FormData();

    // Advanced day-based delay logic
    if (formData.delay_units === 0) {
      // Always set timezone (default to 'customer')
      form.append('timezone', formData.timezone || 'customer');
      // Allowed days
      if (formData.specificDays && Array.isArray(formData.specificDays)) {
        form.append('use_day_restrictions', 'on');
        formData.specificDays.forEach(day => form.append('allowed_days[]', day));
      } else if (formData['allowed_days[]']) {
        // If allowed_days[] is provided directly
        (Array.isArray(formData['allowed_days[]']) ? formData['allowed_days[]'] : [formData['allowed_days[]']]).forEach(day => form.append('allowed_days[]', day));
      } else {
        // Default: all days
        [0,1,2,3,4,5,6].forEach(day => form.append('allowed_days[]', day));
      }
      // Send time
      if (formData.sendTime) {
        form.append('use_send_time', 'on');
        form.append('send_time', formData.sendTime);
      }
      // Standard fields
      form.append('delay_units', 0);
      form.append('delay_unit_value', formData.delay_unit_value);
    } else {
      // For hours/minutes, use provided fields as before
      for (const key in formData) {
        const value = formData[key];
        if (Array.isArray(value)) {
          value.forEach(v => form.append(key, v));
        } else {
          form.append(key, value);
        }
      }
    }

    // Prepare headers for the proxy
    const headers = {
      ...form.getHeaders(),
      'accept': 'application/json, text/plain, */*',
      'x-target-url': klaviyoUrl
    };

    // Send the request to the raw proxy
    const response = await axios.post(proxyUrl, form, {
      headers,
      withCredentials: true
    });

    if (response.data?.success === false) {
      throw new Error(`Failed to configure time delay: ${JSON.stringify(response.data)}`);
    }
    //console.log('✅ Time delay configured:', JSON.stringify(response.data, null, 2));
    console.log(`✅ Time delay configured for action ${actionId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error configuring time delay for action ${actionId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// CONFIGURE EMAIL NAME FOR MESSAGE
export async function configureEmailName(messageId, name) {
  const url = `${KLAVIYO_URL}/ajax/flow/message/${messageId}/name`;
  const formData = new URLSearchParams();
  formData.append('name', name);

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*'
  };

  try {
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data: formData.toString(),
      headers
    });
    if (response.data?.success) {
      //console.log(`Email name configured successfully: "${name}"`);
      return true;
    } else {
      console.error('Failed to configure email name');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('Failed to configure email name:', error);
    return false;
  }
}

// CONFIGURE EMAIL SETTINGS (ignore_throttling, enableUtmTracking)
export async function configureEmailSettings(messageId, settings = {}) {
  const url = `${KLAVIYO_URL}/ajax/flow/message/${messageId}/setting`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*'
  };

  try {
    // Configure ignore throttling (Skip recently Emailed profiles)
    if (settings.hasOwnProperty('ignore_throttling')) {
      const formData = new URLSearchParams();
      formData.append('setting', 'ignore_throttling');
      formData.append('value', settings.ignore_throttling ? 'true' : 'false');

      const response = await axios.post(`${SERVER_URL}/request`, {
        method: 'POST',
        url,
        data: formData.toString(),
        headers
      });

      if (!response.data?.success) {
        console.error('Failed to configure email throttling setting');
        console.error('Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
      //console.log(`Email throttling setting configured: ${settings.ignore_throttling ? 'enabled' : 'disabled'}`);
    }

    // Configure UTM tracking
    if (settings.hasOwnProperty('enableUtmTracking')) {
      const formData = new URLSearchParams();
      formData.append('setting', 'utm');
      formData.append('value', settings.enableUtmTracking ? 'true' : 'false');

      const response = await axios.post(`${SERVER_URL}/request`, {
        method: 'POST',
        url,
        data: formData.toString(),
        headers
      });

      if (!response.data?.success) {
        console.error('Failed to configure UTM tracking setting');
        console.error('Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
      //console.log(`UTM tracking configured: ${settings.enableUtmTracking ? 'enabled' : 'disabled'}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to configure email message:', error);
    return false;
  }
}

// CONFIGURE EMAIL CONTENT (fromEmail, fromName, subject, previewText, replyToEmail)
export async function configureEmailContent(messageId, content = {}) {
  const url = `${KLAVIYO_URL}/ajax/flow/message/${messageId}/content`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*'
  };

  try {
    const formData = new URLSearchParams();
    // Add required fields if provided
    if (content.fromEmail) {
      formData.append('from_email', content.fromEmail);
    }
    if (content.fromName) {
      formData.append('from_label', content.fromName);
    }
    if (content.subject) {
      formData.append('subject', content.subject);
    }
    // Add optional fields
    if (content.previewText) {
      formData.append('preview_text', content.previewText);
    }
    if (content.replyToEmail) {
      formData.append('reply_to_email', content.replyToEmail);
    }

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data: formData.toString(),
      headers
    });

    if (response.data?.success) {
      //console.log('Email content configured successfully');
      return true;
    } else {
      console.error('Failed to configure email content');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('Failed to configure email content:', error);
    return false;
  }
}

// APPLY TEMPLATE TO EMAIL
export async function applyTemplateToEmail(messageId, templateId) {
  const url = `${KLAVIYO_URL}/email-templates/template-library/clone`;
  const formData = new URLSearchParams();
  formData.append('context_obj_id', messageId);
  formData.append('context_obj_type', 'flow');
  formData.append('template_id', templateId);

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*'
  };

  try {
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url,
      data: formData.toString(),
      headers
    });
    // Check for cloned_template_id in the response
    if (response.data?.cloned_template_id) {
      console.log(`Template ${templateId} applied successfully to message ${messageId} (Cloned as: ${response.data.cloned_template_id})`);
      return true;
    } else {
      console.error('Failed to apply template - No cloned template ID received');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('Failed to apply template:', error);
    return false;
  }
}

// CREATE AND CONFIGURE EMAIL ACTION
export async function createAndConfigureEmailAction(pathId, previousActionId = null, emailConfig = {}) {
  // Step 1: Add the email action
  const sendMessageAction = await addAction({
    pathId,
    actionType: 'send_message',
    previous_action_id: previousActionId
  });

  if (!sendMessageAction || !sendMessageAction.messageId) {
    console.error('Failed to add email action or extract messageId');
    return null;
  }

  const messageId = sendMessageAction.messageId;
  let fromEmail = null;
  let fromName = null;

  // Try to get default sender info from the response
  if (sendMessageAction?.data?.paths) {
    for (const pathData of Object.values(sendMessageAction.data.paths)) {
      if (pathData.actions && pathData.actions[sendMessageAction.actionId] && pathData.actions[sendMessageAction.actionId].message) {
        fromEmail = pathData.actions[sendMessageAction.actionId].message.from_email;
        fromName = pathData.actions[sendMessageAction.actionId].message.from_label;
        break;
      }
    }
  }

  // If not found, fetch from flow data as fallback
  if (!fromEmail || !fromName) {
    try {
      const flowData = await getFlowData(sendMessageAction.data.flow.id);
      const message = flowData?.data?.flow?.paths?.[pathId]?.actions?.[sendMessageAction.actionId]?.message;
      if (message) {
        fromEmail = message.from_email;
        fromName = message.from_label;
      }
    } catch (e) {
      // fallback failed, leave as null
    }
  }

  // Step 2: Configure email name
  if (emailConfig.content?.name) {
    const nameSuccess = await configureEmailName(messageId, emailConfig.content.name);
    if (!nameSuccess) {
      throw new Error('Failed to configure email name');
    }
  }

  // Step 3: Apply template if provided
  if (emailConfig.content?.templateId) {
    const templateSuccess = await applyTemplateToEmail(messageId, emailConfig.content.templateId);
    if (!templateSuccess) {
      throw new Error('Failed to apply template');
    }
  }

  // Step 4: Configure email settings if provided
  if (emailConfig.settings) {
    const settingsSuccess = await configureEmailSettings(messageId, emailConfig.settings);
    if (!settingsSuccess) {
      throw new Error('Failed to configure email settings');
    }
  }

  // Step 5: Configure email content (merge defaults if not provided)
  if (emailConfig.content) {
    const content = {
      ...emailConfig.content,
      fromEmail: emailConfig.content.fromEmail || fromEmail,
      fromName: emailConfig.content.fromName || fromName
    };
    const contentSuccess = await configureEmailContent(messageId, content);
    if (!contentSuccess) {
      throw new Error('Failed to configure email content');
    }
  }

  // Done
  return {
    actionId: sendMessageAction.actionId,
    messageId,
    fromEmail,
    fromName
  };
}

// CREATE AND CONFIGURE TIME DELAY ACTION
export async function createAndConfigureTimeDelayAction(pathId, formData, previousActionId = null) {
  // Step 1: Add the time delay action
  const timeDelayAction = await addAction({
    pathId,
    actionType: 'time_delay',
    previous_action_id: previousActionId
  });

  if (!timeDelayAction || !timeDelayAction.actionId) {
    console.error('Failed to add time delay action');
    return null;
  }

  // Step 2: Configure the time delay
  const configResponse = await configureTimeDelay({
    actionId: timeDelayAction.actionId,
    formData
  });

  return {
    actionId: timeDelayAction.actionId,
    configResponse
  };
}

// CREATE AND CONFIGURE FLOW (trigger and filters)
export async function createAndConfigureFlow({ name, triggerConfig = {}, customerFilters = null }) {
  // Step 1: Create the flow
  const flow = await createFlow(name);
  if (!flow || !flow.flowId) {
    console.error('Failed to create flow');
    return null;
  }

  // Step 2: Configure the trigger if config provided
  let triggerConfigResponse = null;
  if (triggerConfig && Object.keys(triggerConfig).length > 0) {
    triggerConfigResponse = await configureFlow(flow.flowId, triggerConfig);
  }

  // Step 3: Set customer filters if provided
  let customerFiltersResponse = null;
  if (customerFilters) {
    customerFiltersResponse = await setFlowCustomerFilters(flow.flowId, customerFilters);
  }

  return {
    ...flow,
    triggerConfigResponse,
    customerFiltersResponse
  };
}

/**
 * Adds and configures a profile property update action in a flow path.
 * @param {string} pathId - The path ID to add the action to.
 * @param {Array} propertyOps - Array of property operation objects for the value field (see Klaviyo API docs).
 * @param {string} [previousActionId] - Optional previous action ID to chain after.
 * @returns {Promise<{actionId: string, configResponse: any}>}
 */
export async function createAndConfigureProfilePropertyUpdateAction(pathId, propertyOps = null, previousActionId = null) {
  // Step 1: Add the update_customer action
  const updateAction = await addAction({
    pathId,
    actionType: 'update_customer',
    previous_action_id: previousActionId
  });

  if (!updateAction || !updateAction.actionId) {
    console.error('Failed to add profile property update action');
    return null;
  }

  // Step 2: Configure the profile property update
  const url = `${KLAVIYO_URL}/ajax/flow/action/${updateAction.actionId}/update`;
  const formData = new URLSearchParams();
  formData.append('pathId', pathId);
  formData.append('setting', 'profile_operations');
  formData.append('value', JSON.stringify(propertyOps));

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*'
  };

  const response = await axios.post(`${SERVER_URL}/request`, {
    method: 'POST',
    url,
    data: formData.toString(),
    headers
  });

  return {
    actionId: updateAction.actionId,
    configResponse: response.data
  };
}



