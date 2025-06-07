import axios from 'axios';

const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

// GET ALL LISTS
export const getLists = async () => {
    try {
        console.log('🔍 Fetching all lists from Klaviyo...');
        
        const response = await axios.post(`${SERVER_URL}/request`, {
            method: 'GET',
            url: `${KLAVIYO_URL}/ajax/lists/simple`
        });
        
        console.log('✅ Lists data:', JSON.stringify(response.data, null, 2));
        return response.data;
        
    } catch (error) {
        console.error('❌ Error fetching lists:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        throw error;
    }
}

// CONVERT A SEGMENT TO A LIST
export const convertToList = async (segmentID) => {
    try {
        console.log(`🔄 Converting segment ${segmentID} to list...`);
        
        const response = await axios.post(`${SERVER_URL}/request`, {
            method: 'POST',
            url: `${KLAVIYO_URL}/ajax/list/${segmentID}/export/to-list`,
            data: {}
        });
        
        if (response.data.new_group_id) {
            console.log('✅ List Created With ID: ' + response.data.new_group_id);
            return response.data.new_group_id;
        } else {
            console.log('❌ No new group ID found');
            return null;
        }
        
    } catch (error) {
        console.error(`❌ Error converting segment ${segmentID} to list:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// SUPPRESS PROFILES IN A LIST
export const listSuppression = async (listId, method) => {
    try {
        let job;
        if (method == 'suppress') { job = 'create'; }
        else if (method == 'unsuppress') { job = 'delete'; }
        
        console.log(`🔒 ${method}ing profiles in list ${listId}...`);
        
        const response = await axios.post(`${SERVER_URL}/request`, {
            method: 'POST',
            url: `${KLAVIYO_URL}/ux-api/profile-suppression-bulk-${job}-jobs/`,
            headers: {
                'revision': '2023-09-15'
            },
            data: {
                "data": {
                    "type": `profile-suppression-bulk-${job}-job`,
                    "attributes": {},
                    "relationships": {
                        "list": {
                            "data": {
                                "type": "list",
                                "id": listId
                            }
                        }
                    }
                }
            }
        });
        
        // Handle both null and empty string as successful suppression
        if (response.data === null || response.data === "" || response.data === undefined || response.data) {
            if (method === 'suppress') {
                console.log('✅ List Suppressed Successfully');
            } else {
                console.log('✅ List Unsuppressed Successfully');
            }
            return true;
        } else {
            console.log('❌ Unexpected response:', JSON.stringify(response.data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error ${method}ing list ${listId}:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// DELETE A LIST
export const deleteList = async (listId) => {
    try {
        console.log(`🗑️ Deleting list ${listId}...`);
        
        const response = await axios.post(`${SERVER_URL}/request`, {
            method: 'DELETE',
            url: `${KLAVIYO_URL}/ajax/group/${listId}`
        });
        
        // Handle both null and empty string as successful deletion
        if (response.data === null || response.data === "" || response.data === undefined) {
            console.log('✅ List Deleted Successfully');
            return true;
        } else {
            console.log('❌ Unexpected response:', JSON.stringify(response.data, null, 2));
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error deleting list ${listId}:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// CREATE A NEW LIST
export const createList = async (listName) => {
    try {
        console.log(`📝 Creating new list: ${listName}...`);
        
        const response = await axios.post(`${SERVER_URL}/request`, {
            method: 'POST',
            url: `${KLAVIYO_URL}/ajax/static-group`,
            data: {
                "name": listName,
                "tags": []
            }
        });
        
        if (response.data && response.data.group_id) {
            const listId = response.data.group_id;
            console.log(`✅ List Created: ${listName} (ID: ${listId})`);
            
            // Now update the list settings to disable double opt-in
            try {
                console.log(`⚙️ Updating list settings to disable double opt-in...`);
                
                const settingsResponse = await axios.post(`${SERVER_URL}/request`, {
                    method: 'POST',
                    url: `${KLAVIYO_URL}/ajax/list/${listId}/settings`,
                    data: {
                        "name": listName,
                        "is_global_unsubscribe": "false",
                        "contact_name": null,
                        "contact_email": null,
                        "is_double_optin": "false",
                        "language": ""
                    }
                });
                
                if (settingsResponse.data && settingsResponse.data.success === true) {
                    console.log(`✅ List settings updated successfully - double opt-in disabled`);
                } else {
                    console.warn(`⚠️ Settings update may have failed:`, JSON.stringify(settingsResponse.data, null, 2));
                }
                
            } catch (settingsError) {
                console.warn(`⚠️ List created but failed to update settings:`, settingsError.message);
                if (settingsError.response) {
                    console.warn(`   Status: ${settingsError.response.status}`);
                    console.warn(`   Data:`, JSON.stringify(settingsError.response.data, null, 2));
                }
                // Don't throw here - the list was created successfully
            }
            
            return listId;
        } else {
            console.error('❌ Failed to create list - No group_id in response');
            console.error('Response:', JSON.stringify(response, null, 2));
            return null;
        }
        
    } catch (error) {
        console.error('❌ Failed to create list:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

