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

testReadProfiles();
//testDeleteBrandData();