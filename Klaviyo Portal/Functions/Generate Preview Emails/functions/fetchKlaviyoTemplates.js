import * as smallFunctions from '../../smallFunctions.js';
import klaviyoTemplates from '../misc/klaviyo_templates.json' with { type: 'json' };
import { writeFileSync } from 'fs';
const saveResults = true;
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GET HTML FOR ALL KLAVIYO TEMPLATES
export async function getAllTemplateHTML() {
  try {
    console.log('🔍 Processing all templates from klaviyo_templates.json...');
    
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
        
        // Extract HTML from the response
        if (previewData?.data?.html) {
          console.log(`   ✅ HTML extracted successfully (${previewData.data.html.length} characters)`);
          return { id: template.id, html: previewData.data.html, error: null };
        } else if (previewData?.html) {
          console.log(`   ✅ HTML extracted successfully (${previewData.html.length} characters)`);
          return { id: template.id, html: previewData.html, error: null };
        } else {
          console.warn(`   ⚠️ No HTML found in preview response for template ${template.id}`);
          console.warn(`   📋 Response structure:`, Object.keys(previewData || {}));
          return { id: template.id, html: null, error: 'No HTML in response' };
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing template ${template.id}:`, error.message);
        return { id: template.id, html: null, error: error.message };
      }
    };
    
    // Process all templates concurrently
    const results = await Promise.allSettled(
      allTemplates.map((template, index) => processTemplate(template, index))
    );
    
    // Collect results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        templateHtmlMap[result.value.id] = result.value.html;
      } else {
        console.error(`❌ Template ${allTemplates[index].id} failed:`, result.reason);
        templateHtmlMap[allTemplates[index].id] = null;
      }
    });
    
    // Summary
    const successCount = Object.values(templateHtmlMap).filter(html => html !== null).length;
    const failedCount = Object.values(templateHtmlMap).filter(html => html === null).length;
    
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
//const templateHtmlMap = await getAllTemplateHTML();
