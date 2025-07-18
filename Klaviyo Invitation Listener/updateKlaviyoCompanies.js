import { getAlternativeCompanies, authorize } from '../Klaviyo Portal/Functions/smallFunctions.js';
import supabase from './supabaseClient.js';

/**
 * Update the klaviyo_accounts table by removing companies that no longer have access
 * This function compares the current Klaviyo alternative companies with the Supabase table
 * and removes entries for companies that have revoked access
 */
export async function updateCurrentCompanies() {
  try {
    const authResponse = await authorize();
    const currentCompany = {
      id: authResponse.data.company,
      name: authResponse.data.company_name
    };
    //console.log(`✅ Current company: ${currentCompany.id}`);
    
    // Step 1: Get current alternative companies from Klaviyo
    const alternativeCompanies = await getAlternativeCompanies();
    
    if (!alternativeCompanies || alternativeCompanies.length === 0) {
      console.log('⚠️ No alternative companies found - this might indicate an authentication issue');
      return { success: false, message: 'No alternative companies found' };
    }

    // Simplify alternative companies to only include id and name
    const simplifiedAlternativeCompanies = alternativeCompanies.map(company => ({
      id: company.id,
      name: company.name
    }));

    // Add current company to the alternative companies list
    const allCompanies = [...simplifiedAlternativeCompanies];
    if (currentCompany.id && !allCompanies.find(company => company.id === currentCompany.id)) {
      allCompanies.push(currentCompany);
    }

    console.log(`✅ Found ${allCompanies.length} companies with current access`);
    //console.log(JSON.stringify(allCompanies, null, 2));
    
    // Step 2: Get all connected companies from Supabase
    console.log('📋 Fetching all connected companies from Supabase...');
    const { data: supabaseCompanies, error: fetchError } = await supabase
      .from('klaviyo_accounts')
      .select('*')
      .eq('connected', true);
    
    if (fetchError) {
      console.error('❌ Error fetching companies from Supabase:', fetchError);
      return { success: false, message: 'Failed to fetch Supabase companies' };
    }
    
    if (!supabaseCompanies || supabaseCompanies.length === 0) {
      console.log('📋 No companies found in Supabase table');
      return { success: true, message: 'No companies in Supabase to sync' };
    }
    
    console.log(`✅ Found ${supabaseCompanies.length} companies in Supabase`);
    
    // Step 3: Create sets for efficient comparison
    const klaviyoCompanyIds = new Set(allCompanies.map(company => company.id));
    const supabaseCompanyIds = new Set(supabaseCompanies.map(company => company.company_id));
    
    // Step 4: Find companies in Supabase that are not in Klaviyo (lost access)
    const companiesToUpdate = supabaseCompanies.filter(company => 
      !klaviyoCompanyIds.has(company.company_id)
    );
    
    if (companiesToUpdate.length === 0) {
      console.log('✅ All Supabase companies still have Klaviyo access - no changes needed');
      return { 
        success: true, 
        message: 'All companies still have access',
        updatedCount: 0,
        totalCompanies: supabaseCompanies.length
      };
    }
    
    console.log(`🔄 Found ${companiesToUpdate.length} companies with revoked access to update:`);
    companiesToUpdate.forEach(company => {
      console.log(`   - ${company.company_name} (ID: ${company.company_id})`);
    });
    
    // Step 5: Update companies that lost access in klaviyo_accounts
    const companyIdsToUpdate = companiesToUpdate.map(company => company.company_id);
    
    const { error: updateError } = await supabase
      .from('klaviyo_accounts')
      .update({
        connected: false,
        notes: `Removed From Company on ${new Date().toISOString()}`
      })
      .in('company_id', companyIdsToUpdate);
    
    if (updateError) {
      console.error('❌ Error updating companies in Supabase:', updateError);
      return { success: false, message: 'Failed to update companies from Supabase' };
    }
    
    console.log(`✅ Successfully updated ${companiesToUpdate.length} companies in Supabase (klaviyo_accounts)`);
    
    // Step 5.5: For each company updated, set klaviyo_connected to false in profiles table
    if (companiesToUpdate.length > 0) {
      console.log('🔄 Updating klaviyo_connected to false in profiles table for updated companies...');
      for (const company of companiesToUpdate) {
        try {
          // First, get the current profile data for this company
          const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('klaviyo_status, klaviyo_brand_data')
            .eq('klaviyo_brand_data->>company_id', company.company_id)
            .single();

          if (fetchError) {
            console.error(`❌ Error fetching profile for company_id ${company.company_id}:`, fetchError);
            continue;
          }

          // Update the klaviyo_status object
          const updatedKlaviyoStatus = {
            ...currentProfile.klaviyo_status,
            connected: false,
            removedFromKlaviyo: true,
            removedDate: new Date().toISOString()
          };

          // Update the klaviyo_brand_data object
          const updatedKlaviyoBrandData = {
            ...currentProfile.klaviyo_brand_data,
            connected: false
          };

          // Update the profile with the modified objects
          const { data, error } = await supabase
            .from('profiles')
            .update({ 
              klaviyo_status: updatedKlaviyoStatus,
              klaviyo_brand_data: updatedKlaviyoBrandData,
              updated_at: new Date().toISOString()
            })
            .eq('klaviyo_brand_data->>company_id', company.company_id);

          if (error) {
            console.error(`❌ Error updating klaviyo_connected for company_id ${company.company_id}:`, error);
          } else {
            console.log(`✅ Set klaviyo_connected to false for company_id ${company.company_id}`);
          }
        } catch (err) {
          console.error(`❌ Exception updating klaviyo_connected for company_id ${company.company_id}:`, err.message);
        }
      }
    }
    
    // Step 6: Log summary
    console.log('📊 Sync Summary:');
    console.log(`   📋 Total companies in Supabase: ${supabaseCompanies.length}`);
    console.log(`   🔄 Companies updated (lost access): ${companiesToUpdate.length}`);
    console.log(`   🔗 Current Klaviyo access: ${allCompanies.length}`);
    
    return {
      success: true,
      message: 'Company sync completed successfully',
      updatedCount: companiesToUpdate.length,
      totalCompanies: supabaseCompanies.length,
      currentAccessCount: allCompanies.length,
      updatedCompanies: companiesToUpdate.map(company => ({
        company_name: company.company_name,
        company_id: company.company_id
      }))
    };
    
  } catch (error) {
    console.error('❌ Error updating current companies:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return { success: false, message: `Error: ${error.message}` };
  }
}

/**
 * Main function to run the company sync
 * This can be called directly or imported and used elsewhere
 */
async function runCheck() {
  console.log('🚀 Starting company access synchronization...');
  
  const result = await updateCurrentCompanies();
  
  if (result.success) {
    if (result.updatedCount > 0) {
      console.log(`🔄 Updated ${result.updatedCount} companies that lost access`);
    }
  } else {
    console.error('❌ Company sync failed:', result.message);
  }
  
  return result;
}

// Run the check immediately
runCheck();

// Then run it every 30 minutes (30 * 60 * 1000 = 1,800,000 milliseconds)
setInterval(runCheck, 30 * 60 * 1000);

console.log('⏰ Company access sync scheduled to run every 30 minutes');