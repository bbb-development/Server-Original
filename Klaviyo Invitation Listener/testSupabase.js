import supabase from './supabaseClient.js';

async function testReadProfiles() {
  const { data, error } = await supabase
    .from('klaviyo_accounts')
    .select('*');

  if (error) {
    console.error('❌ Error reading profiles:', error);
  } else {
    console.log('✅ Profiles data:', data);
  }
}

async function testDeleteBrandData() {
  const { data, error } = await supabase
    .from('klaviyo_brand_data')
    .delete()
    .eq('company_id', 'S2u2Tz');

  if (error) {
    console.error('❌ Error deleting row from klaviyo_brand_data:', error);
  } else {
    console.log('✅ Deleted row(s) from klaviyo_brand_data:', data);
  }
}

async function testUpdateKlaviyoContent() {
  // Made up data for testing
  const klaviyoContentData = {
    flowsCreated: 15,
    emailsProcessed: 250,
    couponsCreated: 8,
    listsCreated: 12,
  };

  const userId = '25d73042-f632-42bc-ac85-6dbbb5ec7f8e';

  try {
    // First, let's get the current klaviyo_status to update it properly
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('klaviyo_status')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current profile:', fetchError);
      return;
    }

    // Update the klaviyo_status object
    const updatedKlaviyoStatus = {
      ...currentProfile.klaviyo_status,
      onboarding_complete: true
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({
        klaviyo_content_created: klaviyoContentData,
        klaviyo_status: updatedKlaviyoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error updating klaviyo_content_created in Supabase:', error);
    } else {
      console.log('✅ Successfully updated klaviyo_content_created for user:', userId);
      console.log('📊 Updated data:', {
        klaviyo_content_created: klaviyoContentData,
        klaviyo_status: updatedKlaviyoStatus
      });
    }
  } catch (e) {
    console.error('❌ Failed to update klaviyo_content_created in Supabase:', e);
  }
}

//testReadProfiles();
//testDeleteBrandData();
testUpdateKlaviyoContent();