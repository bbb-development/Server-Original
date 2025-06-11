import axios from 'axios';

const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

// GET ALL FLOWS
export async function getFlows() {
  try {
    console.log('🔍 Fetching all flows from Klaviyo...');
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/flows/list/?timeframe_key=last_30_days`
    });
    
    //console.log('✅ Flows data:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching flows:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
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
    if (response.data !== undefined) {
      return response.data;
    } else {
      console.error(`❌ No data in response for flow ${flowId}`);
      console.error('Response status:', response.status);
      console.error('Response:', JSON.stringify(response, null, 2));
      throw new Error(`Failed to fetch flow messages for ${flowId}: No data in response`);
    }
    
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
    //console.log(`🔍 Fetching clone mapping candidates for flow ID: ${flowId}...`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/flows/${flowId}/clone-mapping-candidate-elements?company_ids=${companyId}`
    });
    
    //console.log(`✅ Clone mapping candidates fetched for flow ${flowId}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching clone mapping candidates for flow ${flowId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
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
        return { data: null, error: error.message }; // Return structured object for failed requests
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
      
      // Handle cases where flowData is undefined, null, or has error
      if (!flowData) {
        console.log(`⚠️ No response for flow ${flowId}`);
        continue;
      }
      
      if (flowData.error) {
        console.log(`⚠️ Error response for flow ${flowId}: ${flowData.error}`);
        continue;
      }
      
      if (!flowData.data || !flowData.data.flow) {
        console.log(`⚠️ No valid flow data for flow ${flowId}`);
        console.log(`   flowData structure:`, JSON.stringify(flowData, null, 2));
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