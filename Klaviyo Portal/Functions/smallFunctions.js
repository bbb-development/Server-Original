import axios from 'axios';
import * as helperFunctions from './helperFunctions.js';
const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

export async function getProfile() {
  try {
    console.log('🔍 Fetching profile from Klaviyo authorization endpoint...');
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/authorization`
    });
    
    if (!response.data?.success) {
      throw new Error('Authorization request failed - not authenticated');
    }
    
    const data = response.data.data;
    
    // Extract the requested fields
    const profileInfo = {
      company_id: data.company,
      company_name: data.company_name,
      company_plan_key: data.company_plan_key,
      plan_label: data.plan_label,
      user_profile_id: data.user_profile_id,
      company_timezone: data.company_timezone
    };
    
    // Log the extracted information
    console.log('✅ Profile information extracted:');
    console.log(`   Company ID: ${profileInfo.company_id}`);
    console.log(`   Company Name: ${profileInfo.company_name}`);
    console.log(`   Plan: ${profileInfo.plan_label}`);
    console.log(`   User Profile ID: ${profileInfo.user_profile_id}`);
    console.log(`   Company Timezone: ${profileInfo.company_timezone}`);
    
    return profileInfo;
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

export async function authorize(needRelog = false) {
  if (needRelog) {
    console.log('\x1b[32m🟢 Relogin Now...\x1b[0m');
    const relogResponse = await axios.post(`${SERVER_URL}/relog`, { method: 'GET' });
    if (relogResponse.data && relogResponse.data.success) {
      console.log('\x1b[32mReloged Successfully\x1b[0m');
    } else {
      console.log('\x1b[31mRelogin failed:\x1b[0m', relogResponse.data);
    }
    return;
  }
  try {
    console.log('🔍 Checking Klaviyo authorization...');
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/authorization`
    });
    if (!response.data?.success) {
      console.warn('❌ Not authorized. Attempting relogin...');
      const relogResponse = await axios.post(`${SERVER_URL}/relog`, { method: 'GET' });
      if (relogResponse.data && relogResponse.data.success) {
        console.log('\x1b[32mReloged Successfully\x1b[0m');
      } else {
        console.log('\x1b[31mRelogin failed:\x1b[0m', relogResponse.data);
      }
    } else {
      console.log('✅ Already authorized.');
    }
  } catch (error) {
    console.error('❌ Error checking authorization:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// REFRESH SESSION FOR CLIENT (visit /login?switch_to=...)
export async function switchToClientSession(clientId) {
  try {
    console.log(`🔄 Refreshing session for client: ${clientId}...`);
    // Visit the login switch endpoint
    await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/login?switch_to=${clientId}`
    });
    // Optionally, call authorization to refresh CSRF
    await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/authorization`
    });
    console.log(`✅ Session refreshed for client: ${clientId}`);
  } catch (error) {
    console.error(`❌ Error refreshing session for client ${clientId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET ALL CAMPAIGNS
export async function getCampaigns() {
  try {
    console.log('🔍 Fetching all campaigns from Klaviyo...');
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/campaign/list`
    });
    
    console.log('✅ Campaigns data:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET ALL MESSAGES FROM A CAMPAIGN
export async function getCampaignMessages(campaignId) {
  try {
    console.log(`🔍 Fetching messages for campaign ID: ${campaignId}...`);
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/campaign_metadata/${campaignId}`
    });
    
    console.log(`✅ Campaign messages for ${campaignId}:`, JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error fetching campaign messages for ${campaignId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// CREATE A COUPON
export const createCoupon = async (options) => {
  try {
      const {
          name,                    // Coupon name
          prefix,                  // Coupon prefix
          discountType,           // 'fixed' or 'percentage'
          discountAmount,         // Amount of discount
          minimumPurchase = false, // false or number
          startDate = 'now',      // 'now' or date string 'DD/MM/YYYY'
          expiration = 'never'    // 'never', 'days:X', 'hours:X', or 'date:DD/MM/YYYY'
      } = options;

      // Sanitize name and prefix with different rules
      // Name: only letters, numbers, and underscores
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '');
      // Prefix: only letters, numbers, and hyphens
      const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9-]/g, '');

      console.log(`🎟️ Creating coupon: ${sanitizedName} with prefix ${sanitizedPrefix}...`);
      if (sanitizedName !== name) {
          console.log(`   ⚠️ Name sanitized from "${name}" to "${sanitizedName}"`);
      }
      if (sanitizedPrefix !== prefix) {
          console.log(`   ⚠️ Prefix sanitized from "${prefix}" to "${sanitizedPrefix}"`);
      }

      // Get the company timezone from helper function
      const timezone = await helperFunctions.getTimezone();

      // Convert discount type
      const discount_type = discountType.toLowerCase() === 'percentage' ? 1 : 0;

      // Handle minimum purchase
      const has_purchase_min = minimumPurchase !== false;
      const purchase_min = has_purchase_min ? minimumPurchase : null;

      // Handle start date
      let start_type = 0;
      let start_time = null;
      
      if (startDate !== 'now') {
          start_type = 1;
          start_time = helperFunctions.convertDateToTimestamp(startDate, timezone);
      }

      // Handle expiration
      let expiration_type = 0;
      let expiration_seconds = null;
      let end_time = null;

      if (expiration !== 'never') {
          if (expiration.startsWith('days:')) {
              expiration_type = 1;
              const days = parseInt(expiration.split(':')[1]);
              expiration_seconds = days * 24 * 60 * 60; // Convert days to seconds
          } else if (expiration.startsWith('hours:')) {
              expiration_type = 1;
              const hours = parseInt(expiration.split(':')[1]);
              expiration_seconds = hours * 60 * 60; // Convert hours to seconds
          } else if (expiration.startsWith('date:')) {
              expiration_type = 2;
              const dateStr = expiration.split(':')[1];
              end_time = helperFunctions.convertDateToTimestamp(dateStr, timezone);
          }
      }

      const payload = {
          "code": sanitizedName,
          "prefix": sanitizedPrefix,
          "discount_type": discount_type,
          "discount_amount": discountAmount,
          "applies_to_type": 0, // Always apply to entire order
          "applies_to_object": null,
          "purchase_min": purchase_min,
          "has_purchase_min": has_purchase_min,
          "start_type": start_type,
          "start_time": start_time,
          "end_time": end_time,
          "expiration_seconds": expiration_seconds,
          "expiration_type": expiration_type,
          "countries": null
      };

      console.log('📋 Coupon payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${SERVER_URL}/request`, {
          method: 'POST',
          url: `${KLAVIYO_URL}/ajax/coupon/shopify/new`,
          data: payload
      });

      if (response.data && response.data.success === true) {
          console.log(`✅ Coupon created successfully: ${name}`);
          return response.data;
      } else {
          console.error('❌ Failed to create coupon');
          console.error('Response:', JSON.stringify(response.data, null, 2));
          return null;
      }

  } catch (error) {
      console.error('❌ Failed to create coupon:', error.message);
      if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
  }
}

// HELPER FUNCTIONS FOR STRING MATCHING
function levenshteinDistance(a, b) {
  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
          } else {
              matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1, // substitution
                  matrix[i][j - 1] + 1,     // insertion
                  matrix[i - 1][j] + 1      // deletion
              );
          }
      }
  }

  return matrix[b.length][a.length];
}

// Function to check if strings match at specified similarity threshold
export function matchPercent(str1, str2, threshold) {
  const maxLength = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  const similarity = (maxLength - distance) / maxLength;
  return similarity >= threshold;
}

// GET USER INFO (for listing alternative companies)
export async function getUserInfo() {
  try {
    //console.log('🔍 Fetching user info and alternative companies...');
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/account/user-info`
    });
    
    // This endpoint returns user data directly, not wrapped in success object
    if (!response.data || !response.data.alternative_companies) {
      throw new Error('No alternative companies found in response');
    }
    
    //console.log('✅ User info fetched successfully');
    //console.log(`📋 Found ${response.data.alternative_companies.length} alternative companies`);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching user info:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// GET COMPANY ID (find company by name without switching)
export async function getCompanyID(targetClient, threshold = 0.8) {
  try {
    console.log(`🔍 Searching for company: "${targetClient}"...`);
    
    // Get user info to find the list of alternative companies
    const userInfo = await getUserInfo();
    
    // userInfo is the direct response data
    if (!userInfo || !userInfo.alternative_companies) {
      throw new Error('No alternative companies found in user info');
    }
    
    const companies = userInfo.alternative_companies;
    
    // If targetClient is "all", return all companies
    if (targetClient.toLowerCase() === 'all') {
      console.log(`✅ Found ${companies.length} companies:`);
      companies.forEach(company => {
        console.log(`   - ${company.name} (ID: ${company.id})`);
      });
      
      return companies.map(company => ({
        id: company.id,
        name: company.name,
        is_portfolio: company.is_portfolio,
        avatar_color: company.avatar_color,
        is_favorite_account: company.is_favorite_account
      }));
    }
    
    // Find the target company using fuzzy string matching
    const targetCompany = companies.find(company => 
      matchPercent(company.name, targetClient, threshold)
    );
    
    if (!targetCompany) {
      console.error(`❌ Company "${targetClient}" not found in alternative companies:`);
      companies.forEach(company => {
        const similarity = matchPercent(company.name, targetClient, 0);
        console.log(`   - ${company.name} (${Math.round(similarity * 100)}% match)`);
      });
      return null;
    }
    
    console.log(`✅ Found company: "${targetCompany.name}" (ID: ${targetCompany.id})`);
    
    return {
      id: targetCompany.id,
      name: targetCompany.name,
      is_portfolio: targetCompany.is_portfolio,
      avatar_color: targetCompany.avatar_color,
      is_favorite_account: targetCompany.is_favorite_account
    };
    
  } catch (error) {
    console.error(`❌ Error finding company "${targetClient}":`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// CHANGE CLIENT (switch to different company account)
export async function changeClient(targetClient, threshold = 0.8) {
  try {
    console.log(`🔄 Switching to client: "${targetClient}"...`);
    
    // First, check current client
    console.log('🔍 Checking current client...');
    const authResponse = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ajax/authorization`
    });
    
    if (!authResponse.data?.success) {
      throw new Error('Authorization request failed - not authenticated');
    }
    
    const currentCompanyId = authResponse.data.data.company;
    const currentCompanyName = authResponse.data.data.company_name;
    
    console.log(`📍 Currently on: "${currentCompanyName}" (ID: ${currentCompanyId})`);
    
    // Check if we're already on the target client (by ID or name)
    const isAlreadyOnTargetById = currentCompanyId === targetClient;
    const isAlreadyOnTargetByName = matchPercent(currentCompanyName, targetClient, threshold);
    
    if (isAlreadyOnTargetById || isAlreadyOnTargetByName) {
      const matchType = isAlreadyOnTargetById ? 'ID' : 'name';
      console.log(`✅ Already on target client "${currentCompanyName}" (matched by ${matchType}). No switch needed.`);
      return {
        success: true,
        company: {
          id: currentCompanyId,
          name: currentCompanyName
        },
        response: { message: 'Already on target client, no switch performed' },
        switched: false
      };
    }
    
    console.log(`🔄 Need to switch from "${currentCompanyName}" to "${targetClient}"`);
    
    // Get user info to find the list of alternative companies
    const userInfo = await getUserInfo();
    
    // userInfo is now the direct response data, not wrapped in userInfo.data
    if (!userInfo || !userInfo.alternative_companies) {
      throw new Error('No alternative companies found in user info');
    }
    
    const companies = userInfo.alternative_companies;
    
    let targetCompany;
    
    // First, try to find by exact ID match
    targetCompany = companies.find(company => company.id === targetClient);
    
    if (targetCompany) {
      console.log(`✅ Found company by ID: "${targetCompany.name}" (ID: ${targetCompany.id})`);
    } else {
      // If no ID match, try fuzzy name matching
      console.log(`🔍 No exact ID match found, searching by name...`);
      targetCompany = companies.find(company => 
        matchPercent(company.name, targetClient, threshold)
      );
      
      if (targetCompany) {
        //console.log(`✅ Found target company: "${targetCompany.name}" (ID: ${targetCompany.id})`);
      }
    }
    
    if (!targetCompany) {
      console.error(`❌ Company "${targetClient}" not found by ID or name in alternative companies:`);
      companies.forEach(company => {
        const similarity = matchPercent(company.name, targetClient, 0);
        console.log(`   - ${company.name} (ID: ${company.id}) (${Math.round(similarity * 100)}% name match)`);
      });
      throw new Error(`Company "${targetClient}" not found`);
    }
    
    // Switch to the target company
    const switchResponse = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/account/switch`,
      data: `switch=${targetCompany.id}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (switchResponse.data?.success) {
      console.log(`✅ Successfully switched to client: "${targetCompany.name}"`);
      return {
        success: true,
        company: targetCompany,
        response: switchResponse.data,
        switched: true,
        previousClient: {
          id: currentCompanyId,
          name: currentCompanyName
        }
      };
    } else {
      console.error(`❌ Failed to switch to client: "${targetClient}"`);
      console.error('Switch response:', switchResponse.data);
      return {
        success: false,
        company: targetCompany,
        response: switchResponse.data,
        switched: false
      };
    }
    
  } catch (error) {
    console.error(`❌ Error changing client to "${targetClient}":`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// PREVIEW TEMPLATE
export async function previewTemplate(templateId, flowMessageId, idValue, renderDraftUniversalBlocks = false, idType = 'event') {
  try {
    console.log(`🔍 Previewing template ${templateId} with flow message ${flowMessageId}...`);
    
    const payload = {
      flow_message_id: flowMessageId,
      render_draft_universal_blocks: renderDraftUniversalBlocks
    };

    // Add either event_id or profile_id based on the idType parameter
    if (idType === 'event' && idValue) {
      payload.event_id = idValue;
    } else if (idType === 'profile' && idValue) {
      payload.profile_id = idValue;
    } else if (idValue) {
      // For backward compatibility, default to event_id if idType is not specified
      payload.event_id = idValue;
    }
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/template/${templateId}/preview`,
      data: payload
    });
    
    console.log(`✅ Template preview fetched successfully for ${templateId}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error previewing template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}

// FETCH KLAVIYO METRICS
export async function fetchKlaviyoMetrics() {
  try {
    console.log('🔍 Fetching Klaviyo metrics...');
    
    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/ux-api/conversions/metrics/?include_custom=true&include_non_conversion=true`
    });
    
    console.log('✅ Metrics fetched successfully');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    throw error;
  }
}