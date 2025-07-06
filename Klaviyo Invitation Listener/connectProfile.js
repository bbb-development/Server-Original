// Step 1: Get the profile information from the call as a JSON object
// Step 2: Parse the JSON object and the unconnected accounts from the accounts.json file
// Step 3: Call Gemini AI and feed him the data and ask him to return the account id that is most likely to be the correct one
// Step 4: Return the account id to the caller

import { askGemini } from '../NEW Brand Fetch Method/tools/gemini.js';
import * as geminiSchemas from '../NEW Brand Fetch Method/tools/geminiSchemas.js';
import * as geminiPrompts from '../NEW Brand Fetch Method/tools/geminiPrompts.js';
import clients from './clients.json' with { type: 'json' };
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientsFilePath = path.join(__dirname, 'clients.json');

/**
 * Get all unconnected clients from clients.json file
 * @returns {Promise<Array>} Array of clients where connected is false
 */
export async function getUnconnectedClients() {
  try {
    console.log('📋 Reading clients.json file...');
    // Always read the latest file from disk
    const fileContent = await fs.readFile(clientsFilePath, 'utf8');
    const clients = JSON.parse(fileContent);
    // Filter clients where connected is false
    const unconnectedClients = clients.filter(client => client.connected === false);
    console.log(`📊 Found ${unconnectedClients.length} unconnected clients out of ${clients.length} total clients`);
    return unconnectedClients;
  } catch (error) {
    console.error('❌ Error reading clients.json file:', error.message);
    return [];
  }
}

/**
 * Update a client's connection status in clients.json
 * @param {string} klaviyoClientId - The Klaviyo client ID (company_id)
 * @param {string} supabaseId - The Supabase ID to add to the client
 * @returns {Promise<boolean>} Success status
 */
export async function updateClientConnection(klaviyoClientId, supabaseId) {
  try {
    console.log(`💾 Updating client connection for Klaviyo ID: ${klaviyoClientId}`);
    // Always read the latest file from disk
    const fileContent = await fs.readFile(clientsFilePath, 'utf8');
    const clients = JSON.parse(fileContent);
    // Find the client to update
    const clientIndex = clients.findIndex(client => client.company_id === klaviyoClientId);
    if (clientIndex === -1) {
      console.error(`❌ Client with ID ${klaviyoClientId} not found in clients.json`);
      return false;
    }
    // Update the client data
    clients[clientIndex].connected = true;
    clients[clientIndex].supabase_id = supabaseId;
    clients[clientIndex].connected_at = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
    // Write the updated data back to the file
    await fs.writeFile(clientsFilePath, JSON.stringify(clients, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error updating client connection:', error.message);
    return false;
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
  // klaviyoClients: Array of Klaviyo client data (from clients.json where connected = false)

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
        { includeUrlContext: false }, 
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
      
      // Update the client connection status in clients.json
      const updateSuccess = await updateClientConnection(matchResult.klaviyoClientId, matchResult.supabaseId);
      
      if (updateSuccess) {
        console.log('🔄 Client connection status updated successfully');
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
