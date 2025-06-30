import klaviyoTemplates from '../misc/original_template_html_results.json' with { type: 'json' };
import crystalenergy from '../misc/crystalenergy.json' with { type: 'json' };
import { replaceHTML } from './replaceTemplatesHTML.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templateId = 'Yf3Wdz';
const html = klaviyoTemplates.templates[templateId];
const brandData = crystalenergy;
const modifiedHtml = replaceHTML(brandData, html, templateId);

const outputPath = join(__dirname, 'modified_template.html');
writeFileSync(outputPath, modifiedHtml, 'utf8');

console.log(`✅ Modified HTML saved to: ${outputPath}`);
//console.log(modifiedHtml);