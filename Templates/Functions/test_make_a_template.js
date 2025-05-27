import crystalEnergyData from '../../Brand Brief Users/crystalenergy.shop.json' assert { type: 'json' }; // good
import appleData from '../../Brand Brief Users/apple.com.json' assert { type: 'json' }; // not good
import canadaGrowSuppliesData from '../../Brand Brief Users/canadagrowsupplies.com.json' assert { type: 'json' }; // good
import dianeAlberData from '../../Brand Brief Users/dianealber.com.json' assert { type: 'json' }; // good
import euDiabloCosmeticsData from '../../Brand Brief Users/eu.diablocosmetics.com.json' assert { type: 'json' };
import neoniconsData from '../../Brand Brief Users/neonicons.com.json' assert { type: 'json' };
import nikeData from '../../Brand Brief Users/nike.com.json' assert { type: 'json' };
import serenityCbdData from '../../Brand Brief Users/serenitycbd.com.json' assert { type: 'json' };
import siliconWivesData from '../../Brand Brief Users/siliconwives.com.json' assert { type: 'json' };
import superBrandToolsData from '../../Brand Brief Users/superbrandtools.com.json' assert { type: 'json' };
import thenxData from '../../Brand Brief Users/thenx.com.json' assert { type: 'json' };
import { writeFileSync } from 'fs';
import templates from './Templates.json' assert { type: 'json' };


const brandToTest = siliconWivesData;

// Main async function to properly handle promises
async function main() {
  // Example: choose a template by ID
  const templateId = 'b2d5e3f8'; // Change this to the desired template ID

  // Find the template object by ID in all folders
  let selectedTemplate = null;
  for (const group of Object.values(templates)) {
    const found = group.find(t => t.id === templateId);
    if (found) {
      selectedTemplate = found;
      break;
    }
  }

  if (!selectedTemplate) {
    throw new Error('Template not found for ID: ' + templateId);
  }

  // Dynamically import the template file
  const { generateTemplate } = await import('../../' + selectedTemplate.location);

  // Example: use dianeAlberData as before
  // Properly await the template generation which might involve async operations
  const result = await Promise.resolve(generateTemplate(brandToTest));

  // Save the result as done.json in the same folder as the template
  const path = selectedTemplate.location.replace(/[^/]+$/, 'done.json');
  writeFileSync(
    path,
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  console.log('done.json has been saved for template:', selectedTemplate.name);
}

// Run the main function
main();