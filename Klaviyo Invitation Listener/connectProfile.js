// Step 1: Get the profile information from the call as a JSON object
// Step 2: Parse the JSON object and the unconnected accounts from the accounts.json file
// Step 3: Call Gemini AI and feed him the data and ask him to return the account id that is most likely to be the correct one
// Step 4: Return the account id to the caller

import { askGemini } from '../NEW Brand Fetch Method/tools/gemini.js';
import * as geminiSchemas from '../NEW Brand Fetch Method/tools/geminiSchemas.js';
import * as geminiPrompts from '../NEW Brand Fetch Method/tools/geminiPrompts.js';
import supabase from './supabaseClient.js';

/**
 * Get all unconnected clients from Supabase klaviyo_accounts table
 * @returns {Promise<Array>} Array of clients where connected is false
 */
export async function getUnconnectedClients() {
  try {
    console.log('📋 Fetching unconnected clients from Supabase...');
    
    const { data: clients, error } = await supabase
      .from('klaviyo_accounts')
      .select('*')
      .eq('connected', false);
    
    if (error) {
      console.error('❌ Error fetching unconnected clients from Supabase:', error);
      return [];
    }
    
    console.log(`📊 Found ${clients.length} unconnected clients from Supabase`);
    return clients || [];
  } catch (error) {
    console.error('❌ Error fetching unconnected clients:', error.message);
    return [];
  }
}

/**
 * Update a client's connection status in Supabase klaviyo_accounts table
 * @param {string} klaviyoClientId - The Klaviyo client ID (company_id)
 * @returns {Promise<{success: boolean, updatedClient: object|null}>} Success status and updated client data
 */
export async function updateClientConnection(klaviyoClientId) {
  try {
    console.log(`💾 Updating client connection for Klaviyo ID: ${klaviyoClientId}`);
    
    const { data, error } = await supabase
      .from('klaviyo_accounts')
      .update({
        connected: true,
        notes: 'App connected to Klaviyo.'
      })
      .eq('company_id', klaviyoClientId)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error updating client connection in Supabase:`, error);
      return { success: false, updatedClient: null };
    }
    
    if (!data) {
      console.error(`❌ Client with ID ${klaviyoClientId} not found in Supabase`);
      return { success: false, updatedClient: null };
    }
    
    console.log(`✅ Client connection updated successfully in Supabase`);
    return { success: true, updatedClient: data };
  } catch (error) {
    console.error('❌ Error updating client connection:', error.message);
    return { success: false, updatedClient: null };
  }
}

/**
 * Retry utility function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 6, baseDelay = 1000, operationName = 'operation') {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay/1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function matchClientWithKlaviyo(supabaseClient) {
  // Function matches one Supabase client with multiple Klaviyo clients
  // supabaseClient: Single Supabase client data object
  // klaviyoClients: Array of Klaviyo client data (from Supabase klaviyo_accounts table where connected = false)

  // Validate input
  if (!supabaseClient || typeof supabaseClient !== 'object') {
    console.log('❌ Invalid Supabase client data provided');
    return { matchResult: { found: false, klaviyoClientId: '', supabaseId: '', confidence: 'low', matchReason: 'Invalid Supabase client data' }, klaviyoClient: null };
  }

  const klaviyoClients = await getUnconnectedClients();
  
  console.log('🔍 Matching Supabase client with Klaviyo accounts...');
  //console.log('📊 Supabase client data:', JSON.stringify(supabaseClient, null, 2));

  if (klaviyoClients.length === 0) {
    console.log('❌ No unconnected Klaviyo clients found');
    return { matchResult: { found: false, klaviyoClientId: '', supabaseId: '', confidence: 'low', matchReason: 'No unconnected Klaviyo clients available' }, klaviyoClient: null };
  }
  
  try {
    // Call Gemini AI to match the client data
    const matchResultRaw = await retryWithBackoff(
      () => askGemini(
        geminiPrompts.matchClientPrompt(supabaseClient, klaviyoClients),
        geminiSchemas.matchClientSchema
      ),
      6, // 6 retries for Gemini
      1000, // 1 second base delay
      'Client matching with Gemini AI'
    );
    
    // Parse the JSON response
    let matchResult;
    try {
      // Clean the response by removing any trailing 'undefined' or other unwanted text
      const cleanedResponse = String(matchResultRaw).replace(/undefined$/, '').trim();
      matchResult = JSON.parse(cleanedResponse);
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini matching response as JSON, using fallback');
      console.warn('Raw response that failed to parse:', matchResultRaw);
      matchResult = { found: false, klaviyoClientId: '', supabaseId: '', confidence: 'low', matchReason: 'Failed to parse response' };
    }
    
    let matchedKlaviyoClient = null;
    if (matchResult.found && matchResult.klaviyoClientId) {
      matchedKlaviyoClient = klaviyoClients.find(client => client.company_id === matchResult.klaviyoClientId) || null;
    }
    
    if (matchResult.found) {
      console.log('✅ CLIENT MATCH FOUND:');
      console.log(`   🎯 Confidence: ${matchResult.confidence}`);
      console.log(`   🏢 Klaviyo Client ID: ${matchResult.klaviyoClientId}`);
      console.log(`   📋 Supabase ID: ${matchResult.supabaseId}`);
      console.log(`   💡 Reason: ${matchResult.matchReason}`);
      
      // Update the client connection status in Supabase
      const { success: updateSuccess, updatedClient } = await updateClientConnection(matchResult.klaviyoClientId);
      
      if (updateSuccess) {
        console.log('🔄 Client connection status updated successfully');
        matchedKlaviyoClient = updatedClient;
        console.log('📋 Using updated client data from update operation');
      } else {
        console.log('⚠️ Failed to update client connection status');
      }
    } else {
      console.log('❌ No matching client found');
      console.log(`   💡 Reason: ${matchResult.matchReason || 'No confident match identified'}`);
    }
    
    return { matchResult, klaviyoClient: matchedKlaviyoClient };
    
  } catch (error) {
    console.error('❌ Error matching client with Klaviyo accounts:', error.message);
    return { 
      matchResult: { found: false, klaviyoClientId: '', supabaseId: '', confidence: 'low', matchReason: `Error occurred: ${error.message}` },
      klaviyoClient: null
    };
  }
}
