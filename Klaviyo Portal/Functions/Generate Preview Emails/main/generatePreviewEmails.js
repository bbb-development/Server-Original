import { getAllTemplateHTML } from '../functions/fetchKlaviyoTemplates.js';
import { replaceHTML } from '../functions/replaceTemplatesHTML.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const saveResults = false;
//import crystalenergy from '../misc/crystalenergy.json' with { type: 'json' };

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function to generate all preview emails
export async function generatePreviewEmails(brand) {
  try {
    console.log('🚀 Starting preview email generation process...');
    
    // Step 1: Get all template HTML
    console.log('\n📥 Step 1: Fetching all template HTML...');
    const templateHtmlMap = await getAllTemplateHTML();
    
    if (!templateHtmlMap || Object.keys(templateHtmlMap).length === 0) {
      throw new Error('No templates fetched from getAllTemplateHTML()');
    }
    
    const templateIds = Object.keys(templateHtmlMap).filter(id => templateHtmlMap[id] !== null);
    console.log(`✅ Successfully fetched ${templateIds.length} templates`);
    
    // Step 2: Process all templates concurrently with brand replacements
    console.log('\n🔄 Step 2: Processing templates with brand replacements...');
    
    const processTemplate = async (templateId) => {
      try {
        const originalHtml = templateHtmlMap[templateId];
        if (!originalHtml) {
          console.warn(`⚠️ Skipping template ${templateId} - no HTML content`);
          return { templateId, modifiedHtml: null, error: 'No HTML content' };
        }
        
        console.log(`🔄 Processing template ${templateId}...`);
        const modifiedHtml = replaceHTML(brand, originalHtml, templateId);
        
        console.log(`✅ Successfully processed template ${templateId}`);
        return { templateId, modifiedHtml, error: null };
        
      } catch (error) {
        console.error(`❌ Error processing template ${templateId}:`, error.message);
        return { templateId, modifiedHtml: null, error: error.message };
      }
    };
    
    // Process all templates concurrently
    console.log(`🔀 Processing ${templateIds.length} templates concurrently...`);
    const results = await Promise.allSettled(
      templateIds.map(templateId => processTemplate(templateId))
    );
    
    // Step 3: Collect results into modified HTML map
    console.log('\n📊 Step 3: Collecting results...');
    const modifiedHTMLMap = {};
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      const templateId = templateIds[index];
      
      if (result.status === 'fulfilled') {
        const { modifiedHtml, error } = result.value;
        modifiedHTMLMap[templateId] = modifiedHtml;
        
        if (modifiedHtml && !error) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        console.error(`❌ Template ${templateId} processing failed:`, result.reason);
        modifiedHTMLMap[templateId] = null;
        errorCount++;
      }
    });
    
    // Step 4: Save results to JSON file
    
    if (saveResults) {
        // Save results to file
        const finalResults = {
          summary: {
            processedAt: new Date().toISOString()
          },
          templates: modifiedHTMLMap
        };
          const outputPath = join(__dirname, '../misc/modified_template_html_results.json');
          writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
          console.log(`💾 Results saved to ${outputPath}`);
      }

    if (errorCount > 0) {
      console.log(`❌ Failed to process: ${errorCount} templates`);
    }
    console.log(`📊 Total templates: ${templateIds.length}`);
    
    return modifiedHTMLMap;
    
  } catch (error) {
    console.error('❌ Error in generatePreviewEmails:', error.message);
    throw error;
  }
}

// EXAMPLE USAGE:
//await generatePreviewEmails(crystalenergy);