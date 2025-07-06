import * as smallFunctions from '../../smallFunctions.js';
import klaviyoTemplates from '../misc/klaviyo_templates.json' with { type: 'json' };
import { writeFileSync } from 'fs';
const saveResults = false;
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GET HTML FOR ALL KLAVIYO TEMPLATES
export async function getAllTemplateHTML() {
  try {
    console.log('🔍 Processing all templates from klaviyo_templates.json...');
    await smallFunctions.changeClient('BBB Marketing');
    
    const templateHtmlMap = {};
    const allTemplates = Object.values(klaviyoTemplates).flat();
    const totalTemplates = allTemplates.length;
    
    console.log(`\n🚀 Starting concurrent processing of ${totalTemplates} templates...`);
    
    // Create async function for processing a single template
    const processTemplate = async (template, index) => {
      try {
        console.log(`🔄 [${index + 1}/${totalTemplates}] Processing template: ${template.name} (ID: ${template.id})`);
        
        // Determine whether to use eventId or profileId
        let idValue, idType;
        if (template.eventId) {
          idValue = template.eventId;
          idType = 'event';
          console.log(`   📎 Using eventId: ${idValue}`);
        } else if (template.profileId !== undefined) {
          idValue = template.profileId;
          idType = 'profile';
          console.log(`   👤 Using profileId: ${idValue || 'empty string'}`);
        } else {
          console.warn(`   ⚠️ Template ${template.id} has neither eventId nor profileId - skipping`);
          return { id: template.id, html: null, error: 'No eventId or profileId configured' };
        }
        
        // Get the template preview HTML
        const previewData = await smallFunctions.previewTemplate(
          template.id,
          template.flowMessageId,
          idValue,
          false, // renderDraftUniversalBlocks
          idType
        );
        
        // Extract HTML and subject from the response
        let html = null;
        let subject = null;
        
        if (previewData?.data?.html) {
          html = previewData.data.html;
          subject = previewData.data.subject || 'No subject available';
          console.log(`   ✅ HTML extracted successfully (${html.length} characters)`);
          console.log(`   📧 Subject: "${subject}"`);
        } else if (previewData?.html) {
          html = previewData.html;
          subject = previewData.subject || 'No subject available';
          console.log(`   ✅ HTML extracted successfully (${html.length} characters)`);
          console.log(`   📧 Subject: "${subject}"`);
        } else {
          console.warn(`   ⚠️ No HTML found in preview response for template ${template.id}`);
          console.warn(`   📋 Response structure:`, Object.keys(previewData || {}));
        }
        
        return { 
          id: template.id, 
          name: template.newName || template.name,
          subject: subject,
          html: html, 
          error: html ? null : 'No HTML in response' 
        };
        
      } catch (error) {
        console.error(`   ❌ Error processing template ${template.id}:`, error.message);
        return { 
          id: template.id, 
          name: template.newName || template.name,
          subject: null,
          html: null, 
          error: error.message 
        };
      }
    };
    
    // Process all templates concurrently
    const results = await Promise.allSettled(
      allTemplates.map((template, index) => processTemplate(template, index))
    );
    
    // Collect results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        templateHtmlMap[result.value.id] = {
          id: result.value.id,
          name: result.value.name,
          subject: result.value.subject,
          html: result.value.html,
          error: result.value.error
        };
      } else {
        console.error(`❌ Template ${allTemplates[index].id} failed:`, result.reason);
        templateHtmlMap[allTemplates[index].id] = {
          id: allTemplates[index].id,
          name: allTemplates[index].newName || allTemplates[index].name,
          subject: null,
          html: null,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    // Summary
    const successCount = Object.values(templateHtmlMap).filter(template => template.html !== null).length;
    const failedCount = Object.values(templateHtmlMap).filter(template => template.html === null).length;
    
    console.log(`\n📊 Processing complete:`);
    console.log(`   ✅ Successfully processed: ${successCount} templates`);
    if (failedCount > 0) {
      console.log(`   ❌ Failed to process: ${failedCount} templates`);
    } else {
      console.log(`   🎉 All templates processed successfully!`);
    }
    console.log(`   📁 Total templates: ${totalTemplates}`);
    
    if (saveResults) {
      // Save results to file
      const finalResults = {
        summary: {
          totalTemplates,
          successCount,
          failedCount,
          processedAt: new Date().toISOString()
        },
        templates: templateHtmlMap
      };
        const outputPath = join(__dirname, '../misc/original_template_html_results.json');
        writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
        console.log(`💾 Results saved to ${outputPath}`);
    }
    
    return templateHtmlMap;
    
  } catch (error) {
    console.error('❌ Error in getAllTemplateHTML:', error.message);
    throw error;
  }
}

// EXAMPLE USAGE:
//await getAllTemplateHTML();
