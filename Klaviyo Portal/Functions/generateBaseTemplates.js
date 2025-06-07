import generateAC1 from '../Templates/Cart Abandoned/AC 1 Generator.js';
import generateAC2 from '../Templates/Cart Abandoned/AC 2 Generator.js';
import generateAC3 from '../Templates/Cart Abandoned/AC 3 Generator.js';
import generateAC4 from '../Templates/Cart Abandoned/AC 4 Generator.js';
import generateWF1 from '../Templates/Welcome Flow/WF 1 Generator.js';
import generateWF2 from '../Templates/Welcome Flow/WF 2 Generator.js';
import generateWF3 from '../Templates/Welcome Flow/WF 3 Generator.js';
import generateBA1 from '../Templates/Browse Abandoned/BA 1 Generator.js';
import * as smallFunctions from './smallFunctions.js';

import siliconWivesData from './siliconwives.com.json' assert { type: 'json' };

async function generateBaseTemplates() {
const track_time = true;
let start_time;
if (track_time) { start_time = new Date(); }

const brand = siliconWivesData; // Just for testing. It will be replaced with the brand data from the database.

console.log("Base Templates Generating for " + brand.brandBrief.data.brand.data.brandName);

await Promise.all([
    //generateAC1(brand, brandKlaviyoId),
    //generateAC2(brand, brandKlaviyoId),
    //generateAC3(brand, brandKlaviyoId),
    //generateAC4(brand, brandKlaviyoId),
    //generateWF1(brand, brandKlaviyoId),
    //generateWF2(brand, brandKlaviyoId),
    //generateWF3(brand, brandKlaviyoId),
    generateBA1(brand)
]);
console.log("Base Templates Generated for " + brand.brandBrief.data.brand.data.brandName);

if (track_time) {
  const end_time = new Date();
  const execution_time = end_time - start_time;
  console.log(`Execution time: ${(execution_time / 1000).toFixed(2)} seconds`);
}
}

//generateBaseTemplates();

export default {
    generateAC1,
    generateAC2,
    generateAC3,
    generateAC4,
    generateWF1,
    generateWF2,
    generateWF3,
    generateBA1,
    generateBaseTemplates
};