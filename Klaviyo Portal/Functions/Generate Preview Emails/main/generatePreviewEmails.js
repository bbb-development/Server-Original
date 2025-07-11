import { getAllTemplateHTML } from '../functions/fetchKlaviyoTemplates.js';
import { replaceHTML } from '../functions/replaceTemplatesHTML.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const saveResults = true;
//import crystalenergy from '../misc/crystalenergy.json' with { type: 'json' };

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function to generate all preview emails
export async function generatePreviewEmails(brand, templateHtmlMap) {
  try {
    console.log('🚀 Starting preview email generation process...');
    
    if (!templateHtmlMap) {
      // Step 1: Get all template HTML
      console.log('\n📥 Step 1: Fetching all template HTML...');
      templateHtmlMap = await getAllTemplateHTML();
    }
    
    if (!templateHtmlMap || Object.keys(templateHtmlMap).length === 0) {
      throw new Error('No templates fetched from getAllTemplateHTML()');
    }
    
    const templateIds = Object.keys(templateHtmlMap).filter(id => templateHtmlMap[id]?.html !== null);
    console.log(`✅ Successfully fetched ${templateIds.length} templates`);
    
    // Step 2: Process all templates concurrently with brand replacements
    console.log('\n🔄 Step 2: Processing templates with brand replacements...');
    
    const processTemplate = async (templateId) => {
      try {
        const templateData = templateHtmlMap[templateId];
        if (!templateData?.html) {
          console.warn(`⚠️ Skipping template ${templateId} - no HTML content`);
          return { 
            templateId, 
            name: templateData?.name || 'Unknown',
            subject: templateData?.subject || 'No subject',
            modifiedHtml: null, 
            error: 'No HTML content' 
          };
        }
        
        console.log(`🔄 Processing template ${templateId}...`);
        const modifiedHtml = replaceHTML(brand, templateData.html, templateId);
        
        console.log(`✅ Successfully processed template ${templateId}`);
        return { 
          templateId, 
          name: templateData.name,
          subject: templateData.subject,
          modifiedHtml, 
          error: null 
        };
        
      } catch (error) {
        console.error(`❌ Error processing template ${templateId}:`, error.message);
        const templateData = templateHtmlMap[templateId];
        return { 
          templateId, 
          name: templateData?.name || 'Unknown',
          subject: templateData?.subject || 'No subject',
          modifiedHtml: null, 
          error: error.message 
        };
      }
    };
    
    // Process all templates concurrently
    console.log(`🔀 Processing ${templateIds.length} templates concurrently...`);
    const results = await Promise.allSettled(
      templateIds.map(templateId => processTemplate(templateId))
    );
    
    // Step 3: Collect results into enhanced template map
    console.log('\n📊 Step 3: Collecting results...');
    const enhancedTemplatesMap = {};
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      const templateId = templateIds[index];
      
      if (result.status === 'fulfilled') {
        const { templateId: id, name, subject, modifiedHtml, error } = result.value;
        enhancedTemplatesMap[templateId] = {
          id: id,
          name: name,
          subject: subject,
          html: modifiedHtml
        };
        
        if (modifiedHtml && !error) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        console.error(`❌ Template ${templateId} processing failed:`, result.reason);
        const templateData = templateHtmlMap[templateId];
        enhancedTemplatesMap[templateId] = {
          id: templateId,
          name: templateData?.name || 'Unknown',
          subject: templateData?.subject || 'No subject',
          html: null
        };
        errorCount++;
      }
    });
    
    // Step 4: Save results to JSON file
    
    if (saveResults) {
        // Save results to file
        const finalResults = {
          summary: {
            processedAt: new Date().toISOString(),
            successCount,
            errorCount,
            totalTemplates: templateIds.length
          },
          templates: enhancedTemplatesMap
        };
          const outputPath = join(__dirname, `../Generated Brand Preview Templates/${brand.geminiBrandBrief.brandName}/emails.json`);
          const outputDir = dirname(outputPath);
          
          // Create directory if it doesn't exist
          if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
          }
          
          writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
          console.log(`💾 Results saved to ${outputPath}`);
      }

    console.log(`✅ Successfully processed: ${successCount} templates`);
    if (errorCount > 0) {
      console.log(`❌ Failed to process: ${errorCount} templates`);
    }
    console.log(`📊 Total templates: ${templateIds.length}`);
    
    return enhancedTemplatesMap;
    
  } catch (error) {
    console.error('❌ Error in generatePreviewEmails:', error.message);
    throw error;
  }
}

// EXAMPLE USAGE:
//await generatePreviewEmails(crystalenergy);