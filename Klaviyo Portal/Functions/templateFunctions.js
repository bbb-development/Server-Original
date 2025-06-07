import axios from 'axios';

const SERVER_URL = 'http://138.68.69.38:3001';
const KLAVIYO_URL = 'https://www.klaviyo.com';

// CREATE NEW TEMPLATE (clone from template library)
export const createNewTemplate = async (templateId = 'W3LaqH') => {
  try {
    console.log(`📋 Creating new template by cloning ${templateId}...`);

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/email-templates/template-library/${templateId}/clone`,
      data: "should_apply_branding=true"
    });

    if (response.data?.cloned_template_id) {
      console.log(`✅ New template created with ID: ${response.data.cloned_template_id}`);
      return response.data.cloned_template_id;
    } else {
      console.error('❌ Failed to create template - No cloned_template_id in response');
      console.error('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error('❌ Error creating new template:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// CLONE TEMPLATE (clone from template library with custom name)
export const cloneTemplate = async (templateId, newTemplateName, contextObjId = 'ShNPvE') => {
  try {
    console.log(`📋 Cloning template ${templateId} with name "${newTemplateName}"...`);

    const formData = new URLSearchParams({
      context_obj_id: contextObjId,
      context_obj_type: 'company',
      new_template_name: newTemplateName,
      template_id: templateId
    });

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/email-templates/template-library/clone`,
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log(`✅ Template cloned successfully with name "${newTemplateName}"`);
    //console.log('Response:', JSON.stringify(response.data.cloned_template_id, null, 2));
    return response.data.cloned_template_id;

  } catch (error) {
    console.error(`❌ Error cloning template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// RENAME TEMPLATE
export const renameTemplate = async (templateId, newName) => {
  try {
    console.log(`✏️ Renaming template ${templateId} to "${newName}"...`);

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/ajax/email-template/${templateId}/name`,
      data: new URLSearchParams({ name: newName }).toString()
    });

    console.log(`✅ Template renamed successfully to "${newName}"`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error renaming template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// GET UNIVERSAL ELEMENTS
export const getUniversalElements = async () => {
  try {
    console.log('🔍 Fetching universal elements...');

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/template/universal?page_size=all`
    });

    console.log('✅ Universal elements fetched:', JSON.stringify(response.data, null, 2));
    return response.data;

  } catch (error) {
    console.error('❌ Error fetching universal elements:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// GET TEMPLATE DATA
export const getTemplateData = async (templateId) => {
  try {
    //console.log(`🔍 Fetching template data for ID: ${templateId}...`);

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'GET',
      url: `${KLAVIYO_URL}/template/full/${templateId}`
    });

    //console.log(`✅ Template data fetched for ${templateId}`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error getting template data for ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// UPDATE TEMPLATE (patch template with payload)
export const updateTemplate = async (templateId, payload) => {
  try {
    //console.log(`🔧 Updating template ${templateId}...`);

    const response = await axios.post(`${SERVER_URL}/request`, {
      method: 'POST',
      url: `${KLAVIYO_URL}/template/${templateId}/patch`,
      data: payload
    });

    //console.log(`✅ Template ${templateId} updated successfully`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error updating template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// BATCH UPDATE TEXT IN TEMPLATE (Universal text replacement function - single request for all changes)
export const batchUpdateTextInTemplate = async (templateId, textReplacements, templateData = null) => {
  try {
    console.log(`🔍 Starting batch text updates for template ${templateId}...`);
    console.log(`📋 ${textReplacements.length} replacement(s) to process`);

    // Fetch template data once for all replacements
    if (!templateData) {
      templateData = await getTemplateData(templateId);
    }
    
    // Group all text matches by node to avoid conflicts
    const nodeOperations = {};
    let totalMatches = 0;

    // First pass: collect all text matches for each node
    for (let i = 0; i < textReplacements.length; i++) {
      const { oldText, newText } = textReplacements[i];
      //console.log(`\n🔍 Searching for: "${oldText}" → "${newText}"`);
      
      // Find all blocks containing this specific text
      const textMatches = findTextInBlocks(templateData, oldText);
      
      if (textMatches.length === 0) {
        console.warn(`⚠️ No matches found for: "${oldText}". Had to be replaced with "${newText}"`);
        continue;
      }

      //console.log(`📋 Found ${textMatches.length} match(es) for "${oldText}"`);
      totalMatches += textMatches.length;

      // Group matches by node ID and field type
      textMatches.forEach(match => {
        const isSubBlock = match.field.startsWith('sub_blocks[');
        let nodeId;
        
        if (isSubBlock) {
          const subBlockIndex = parseInt(match.field.match(/sub_blocks\[(\d+)\]/)[1]);
          const subBlock = match.block.data.sub_blocks[subBlockIndex];
          nodeId = subBlock.id;
        } else {
          nodeId = match.block.data.id;
        }

        if (!nodeOperations[nodeId]) {
          nodeOperations[nodeId] = {
            block: match.block,
            isSubBlock: isSubBlock,
            subBlockIndex: isSubBlock ? parseInt(match.field.match(/sub_blocks\[(\d+)\]/)[1]) : null,
            textReplacements: []
          };
        }

        // Add this text replacement to the node's list
        nodeOperations[nodeId].textReplacements.push({
          oldText,
          newText,
          field: match.field,
          match: match
        });

        //console.log(`📍 Queuing ${isSubBlock ? 'sub_block' : 'block'}: ${nodeId}, field: ${isSubBlock ? match.field.split('.attributes.')[1] : match.field}`);
      });
    }

    if (Object.keys(nodeOperations).length === 0) {
      console.warn(`⚠️ No operations to perform - no text matches found`);
      return null;
    }

    //console.log(`🔧 Processing ${Object.keys(nodeOperations).length} unique node(s)...`);

    // Second pass: create final operations by applying all text replacements per node
    const finalOps = [];

    Object.entries(nodeOperations).forEach(([nodeId, nodeOp]) => {
      const { block, isSubBlock, subBlockIndex, textReplacements } = nodeOp;
      
      //console.log(`🔄 Processing node ${nodeId} with ${textReplacements.length} text replacement(s)`);

      if (isSubBlock) {
        const subBlock = block.data.sub_blocks[subBlockIndex];
        
        // Start with original attributes
        const updatedAttrs = { ...subBlock.attributes };
        let updatedContent = subBlock.content;
        
        // Apply all text replacements to this sub-block
        textReplacements.forEach(({ oldText, newText, field }) => {
          if (field.includes('.content')) {
            if (updatedContent && typeof updatedContent === 'string') {
              updatedContent = updatedContent.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
            }
          } else {
            // Attribute field
            const attributeName = field.split('.attributes.')[1];
            if (updatedAttrs[attributeName] && typeof updatedAttrs[attributeName] === 'string') {
              updatedAttrs[attributeName] = updatedAttrs[attributeName].replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
            }
          }
        });
        
        finalOps.push({
          "kind": 3,
          "node_id": nodeId,
          "tag": "subblock",
          "attrs": {
            "attrs": updatedAttrs,
            "content": updatedContent,
            "block_type": subBlock.block_type
          }
        });
      } else {
        // Main block
        const blockData = block.data;
        
        // Start with original attributes and content
        const updatedAttrs = { ...blockData.attributes };
        let updatedContent = blockData.content;
        
        // Apply all text replacements to this block
        textReplacements.forEach(({ oldText, newText, field }) => {
          if (field === 'content') {
            if (updatedContent && typeof updatedContent === 'string') {
              updatedContent = updatedContent.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
            }
          } else {
            // Attribute field
            if (updatedAttrs[field] && typeof updatedAttrs[field] === 'string') {
              updatedAttrs[field] = updatedAttrs[field].replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
            }
          }
        });
        
        finalOps.push({
          "kind": 3,
          "node_id": nodeId,
          "tag": "blockData",
          "attrs": {
            "attrs": updatedAttrs,
            "content": updatedContent,
            "block_type": blockData.block_type
          }
        });
      }
    });

    //console.log(`🔧 Created ${finalOps.length} final operation(s) for ${totalMatches} text match(es)`);
    //console.log(`🔧 Making single patch request...`);

    // Create single patch payload with all operations
    const patchPayload = {
      "multi_user_conflict_id": templateData.multi_user_conflict_id + 1,
      "ops": finalOps
    };

    // Make single patch request for all replacements
    const result = await updateTemplate(templateId, patchPayload);
    
    console.log(`✅ Batch update completed! All ${textReplacements.length} text replacement(s) applied in one request`);
    return result;

  } catch (error) {
    console.error(`❌ Error in batch update for template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

function findTextInBlocks(templateData, targetText) {
  const textMatches = [];
  
  // Recursively search through the template structure
  function searchBlocks(obj, path = '') {
    if (obj && typeof obj === 'object') {
      // Check if this is a block with data
      if (obj.data && obj.data.id && (obj.data.attributes || obj.data.content)) {
        const blockData = obj.data;
        
        // Search in content field
        if (blockData.content && typeof blockData.content === 'string' && 
            blockData.content.includes(targetText)) {
          textMatches.push({
            block: obj,
            field: 'content',
            path: path,
            blockType: blockData.block_type,
            foundText: targetText
          });
        }
        
        // Search in all attribute fields
        if (blockData.attributes) {
          for (const [key, value] of Object.entries(blockData.attributes)) {
            if (typeof value === 'string' && value.includes(targetText)) {
              textMatches.push({
                block: obj,
                field: key,
                path: path + `.attributes.${key}`,
                blockType: blockData.block_type,
                foundText: targetText
              });
            }
          }
        }
        
        // Search in sub_blocks content and attributes
        if (blockData.sub_blocks) {
          blockData.sub_blocks.forEach((subBlock, index) => {
            if (subBlock.content && typeof subBlock.content === 'string' && 
                subBlock.content.includes(targetText)) {
              textMatches.push({
                block: obj,
                field: `sub_blocks[${index}].content`,
                path: path + `.sub_blocks[${index}].content`,
                blockType: subBlock.block_type,
                foundText: targetText
              });
            }
            
            if (subBlock.attributes) {
              for (const [key, value] of Object.entries(subBlock.attributes)) {
                if (typeof value === 'string' && value.includes(targetText)) {
                  textMatches.push({
                    block: obj,
                    field: `sub_blocks[${index}].attributes.${key}`,
                    path: path + `.sub_blocks[${index}].attributes.${key}`,
                    blockType: subBlock.block_type,
                    foundText: targetText
                  });
                }
              }
            }
          });
        }
      }
      
      // Recursively search nested objects and arrays
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          searchBlocks(value, path ? `${path}.${key}` : key);
        }
      }
    }
  }
  
  searchBlocks(templateData);
  return textMatches;
}

// HELPER FUNCTION: Find text in blocks and return the src value from the block where text is found
export const findSrcByText = (templateData, targetText) => {
  console.log(`🔍 Searching for text "${targetText}" to extract src...`);
  let foundSrc = null;
  
  // Recursively search through the template structure
  function searchBlocks(obj, path = '') {
    if (obj && typeof obj === 'object') {
      // Check if this is a block with data
      if (obj.data && obj.data.id) {
        const blockData = obj.data;
        let textFoundInThisBlock = false;
        let targetSubBlockIndex = -1; // Track which sub-block contains the text
        
        // Search in content field
        if (blockData.content && typeof blockData.content === 'string' && 
            blockData.content.includes(targetText)) {
          console.log(`📋 Found text "${targetText}" in block content (${blockData.id})`);
          textFoundInThisBlock = true;
        }
        
        // Search in all attribute fields
        if (blockData.attributes && !textFoundInThisBlock) {
          for (const [key, value] of Object.entries(blockData.attributes)) {
            if (typeof value === 'string' && value.includes(targetText)) {
              console.log(`📋 Found text "${targetText}" in block attribute ${key} (${blockData.id})`);
              textFoundInThisBlock = true;
              break;
            }
          }
        }
        
        // Search in sub_blocks content and attributes
        if (blockData.sub_blocks && !textFoundInThisBlock) {
          blockData.sub_blocks.forEach((subBlock, index) => {
            if (subBlock.content && typeof subBlock.content === 'string' && 
                subBlock.content.includes(targetText)) {
              console.log(`📋 Found text "${targetText}" in sub-block[${index}] content (${blockData.id})`);
              textFoundInThisBlock = true;
              targetSubBlockIndex = index;
            }
            
            if (subBlock.attributes && !textFoundInThisBlock) {
              for (const [key, value] of Object.entries(subBlock.attributes)) {
                if (typeof value === 'string' && value.includes(targetText)) {
                  console.log(`📋 Found text "${targetText}" in sub-block[${index}] attribute ${key} (${blockData.id})`);
                  textFoundInThisBlock = true;
                  targetSubBlockIndex = index;
                  break;
                }
              }
            }
          });
        }
        
        // If text was found in this block, try to extract src
        if (textFoundInThisBlock) {
          // If text was found in a specific sub-block, get src from that sub-block
          if (targetSubBlockIndex >= 0 && blockData.sub_blocks && blockData.sub_blocks[targetSubBlockIndex]) {
            const targetSubBlock = blockData.sub_blocks[targetSubBlockIndex];
            if (targetSubBlock.attributes && targetSubBlock.attributes.src) {
              foundSrc = targetSubBlock.attributes.src;
              console.log(`✅ Found src in sub-block[${targetSubBlockIndex}] attributes: ${foundSrc}`);
              return true; // Found it, stop searching
            } else {
              console.log(`⚠️ Text found in sub-block[${targetSubBlockIndex}] but no src available`);
            }
          }
          // If text was found in main block (not sub-block), check main block's src
          else if (targetSubBlockIndex === -1) {
            if (blockData.attributes && blockData.attributes.src) {
              foundSrc = blockData.attributes.src;
              console.log(`✅ Found src in block attributes: ${foundSrc}`);
              return true; // Found it, stop searching
            } else {
              console.log(`⚠️ Text found in block but no src available in block ${blockData.id}`);
            }
          }
        }
      }
      
      // Recursively search nested objects and arrays
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          if (searchBlocks(value, path ? `${path}.${key}` : key)) {
            return true; // Found it, stop searching
          }
        }
      }
    }
    return false;
  }
  
  searchBlocks(templateData);
  
  if (foundSrc) {
    console.log(`✨ Successfully extracted src for text "${targetText}": ${foundSrc}`);
  } else {
    console.warn(`❌ No src found for text "${targetText}"`);
  }
  
  return foundSrc;
};

// GET ALL COMPANY TEMPLATES
export const getAllCompanyTemplates = async (searchQuery = '', sortBy = 'EDITED_NEWEST_FIRST') => {
  try {
    console.log('🔍 Fetching all company templates with pagination...');

    let allTemplates = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`📄 Fetching page ${currentPage}...`);
      
      const response = await axios.post(`${SERVER_URL}/request`, {
        method: 'GET',
        url: `${KLAVIYO_URL}/template-gallery-list/company-templates/?search_query=${encodeURIComponent(searchQuery)}&sort_by=${sortBy}&page=${currentPage}`,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const pageData = response.data;
      
      if (pageData.templates && pageData.templates.length > 0) {
        allTemplates.push(...pageData.templates);
        console.log(`✅ Page ${currentPage}: Found ${pageData.templates.length} templates`);
      }

      hasNextPage = pageData.has_next_page === true;
      currentPage++;
      
      if (!hasNextPage) {
        console.log(`🏁 Reached last page. Total templates fetched: ${allTemplates.length}`);
      }
    }

    return {
      templates: allTemplates,
      has_next_page: false,
      total_count: allTemplates.length
    };

  } catch (error) {
    console.error('❌ Error fetching company templates:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// FIND TEMPLATE BY ID (optimized search)
export const findTemplateById = async (templateId) => {
  try {
    console.log(`🔍 Searching for template with ID: ${templateId}...`);
    
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`📄 Searching page ${currentPage}...`);
      
      const response = await axios.post(`${SERVER_URL}/request`, {
        method: 'GET',
        url: `${KLAVIYO_URL}/template-gallery-list/company-templates/?search_query=&sort_by=EDITED_NEWEST_FIRST&page=${currentPage}`,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const pageData = response.data;
      
      if (pageData.templates && pageData.templates.length > 0) {
        // Search for the target template on this page
        const template = pageData.templates.find(t => t.template_id === templateId);
        
        if (template) {
          console.log(`✅ Found template: "${template.name}" (ID: ${template.template_id}) on page ${currentPage}`);
          return template;
        }
        
        console.log(`📋 Page ${currentPage}: ${pageData.templates.length} templates checked, target not found`);
      }

      hasNextPage = pageData.has_next_page === true;
      currentPage++;
      
      if (!hasNextPage) {
        console.log(`🏁 Searched all pages. Template with ID ${templateId} not found.`);
        break;
      }
    }
    
    console.warn(`⚠️ Template with ID ${templateId} not found in any page`);
    return null;

  } catch (error) {
    console.error(`❌ Error finding template ${templateId}:`, error.message);
    throw error;
  }
};

// ADD ATTRIBUTE TO BLOCKS (find blocks with specific attributes and add new attributes)
export const addAttributeToBlocks = async (templateId, attributeUpdates, templateData = null) => {
  try {
    console.log(`🔍 Starting attribute updates for template ${templateId}...`); 

    // Fetch template data once for all updates
    if (!templateData) {
      templateData = await getTemplateData(templateId);
    }
    
    const nodeOperations = {};
    let totalMatches = 0;

    // Process each attribute update
    for (let i = 0; i < attributeUpdates.length; i++) {
      const { findAttribute, addAttributes } = attributeUpdates[i];
      console.log(`🔍 Searching for blocks with attribute: "${findAttribute}"`);
      
      // Find all blocks containing this specific attribute
      const attributeMatches = findBlocksWithAttribute(templateData, findAttribute);
      
      if (attributeMatches.length === 0) {
        console.warn(`⚠️ No blocks found with attribute: "${findAttribute}"`);
        continue;
      }

      console.log(`📋 Found ${attributeMatches.length} block(s) with attribute "${findAttribute}"`);
      totalMatches += attributeMatches.length;

      // Process each match
      attributeMatches.forEach(match => {
        const isSubBlock = match.isSubBlock;
        const nodeId = match.nodeId;

        if (!nodeOperations[nodeId]) {
          nodeOperations[nodeId] = {
            block: match.block,
            isSubBlock: isSubBlock,
            subBlockIndex: isSubBlock ? match.subBlockIndex : null,
            attributesToAdd: {}
          };
        }

        // Merge attributes to add
        Object.assign(nodeOperations[nodeId].attributesToAdd, addAttributes);
        
        console.log(`📍 Queuing ${isSubBlock ? 'sub_block' : 'block'}: ${nodeId}, adding attributes:`, addAttributes);
      });
    }

    if (Object.keys(nodeOperations).length === 0) {
      console.warn(`⚠️ No operations to perform - no matching blocks found`);
      return null;
    }

    console.log(`🔧 Processing ${Object.keys(nodeOperations).length} unique node(s)...`);

    // Create final operations by adding attributes to blocks
    const finalOps = [];

    Object.entries(nodeOperations).forEach(([nodeId, nodeOp]) => {
      const { block, isSubBlock, subBlockIndex, attributesToAdd } = nodeOp;
      
      console.log(`🔄 Processing node ${nodeId} with ${Object.keys(attributesToAdd).length} attribute(s) to add`);

      if (isSubBlock) {
        const subBlock = block.data.sub_blocks[subBlockIndex];
        
        // Merge new attributes with existing ones
        const updatedAttrs = { ...subBlock.attributes, ...attributesToAdd };
        
        finalOps.push({
          "kind": 3,
          "node_id": nodeId,
          "tag": "subblock",
          "attrs": {
            "attrs": updatedAttrs,
            "content": subBlock.content,
            "block_type": subBlock.block_type
          }
        });
      } else {
        // Main block
        const blockData = block.data;
        
        // Merge new attributes with existing ones
        const updatedAttrs = { ...blockData.attributes, ...attributesToAdd };
        
        finalOps.push({
          "kind": 3,
          "node_id": nodeId,
          "tag": "blockData",
          "attrs": {
            "attrs": updatedAttrs,
            "content": blockData.content,
            "block_type": blockData.block_type
          }
        });
      }
    });

    console.log(`🔧 Created ${finalOps.length} final operation(s) for ${totalMatches} block match(es)`);

    // Create single patch payload with all operations
    const patchPayload = {
      "multi_user_conflict_id": templateData.multi_user_conflict_id + 1,
      "ops": finalOps
    };

    // Make single patch request for all updates
    const result = await updateTemplate(templateId, patchPayload);
    
    console.log(`✅ Attribute updates completed! All ${attributeUpdates.length} update(s) applied in one request`);
    return result;

  } catch (error) {
    console.error(`❌ Error in attribute updates for template ${templateId}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// Helper function to find blocks with specific attributes
function findBlocksWithAttribute(templateData, targetAttribute) {
  const matches = [];
  
  // Recursively search through the template structure
  function searchBlocks(obj, path = '') {
    if (obj && typeof obj === 'object') {
      // Check if this is a block with data
      if (obj.data && obj.data.id) {
        const blockData = obj.data;
        
        // Check main block attributes
        if (blockData.attributes && blockData.attributes.hasOwnProperty(targetAttribute)) {
          matches.push({
            block: obj,
            nodeId: blockData.id,
            isSubBlock: false,
            subBlockIndex: null,
            path: path,
            blockType: blockData.block_type
          });
        }
        
        // Check sub_blocks attributes
        if (blockData.sub_blocks) {
          blockData.sub_blocks.forEach((subBlock, index) => {
            if (subBlock.attributes && subBlock.attributes.hasOwnProperty(targetAttribute)) {
              matches.push({
                block: obj,
                nodeId: subBlock.id,
                isSubBlock: true,
                subBlockIndex: index,
                path: path + `.sub_blocks[${index}]`,
                blockType: subBlock.block_type
              });
            }
          });
        }
      }
      
      // Recursively search nested objects and arrays
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          searchBlocks(value, path ? `${path}.${key}` : key);
        }
      }
    }
  }
  
  searchBlocks(templateData);
  return matches;
}