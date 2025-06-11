// testKlaviyoService.js
import axios from 'axios';

const BASE = 'http://138.68.69.38:3001'; 
import { readFile } from 'fs/promises';
const siliconWivesData = JSON.parse(
  await readFile(new URL('./siliconwives.com.json', import.meta.url))
);
const brand = siliconWivesData; // Just for testing. It will be replaced with the brand data from the database.

async function runTests() {
  try {
    // 1️⃣ Status
    //const status = await axios.get(`${BASE}/status`);
    //console.log('STATUS:', status.data);
//
    //// 2️⃣ Health
    //const health = await axios.get(`${BASE}/health`);
    //console.log('HEALTH:', health.data);
//
    //// 3️⃣ Proxy GET via /request
    //const auth = await axios.post(`${BASE}/request`, {
    //  method: 'GET',
    //  url   : 'https://www.klaviyo.com/ajax/authorization'
    //});
    
    //console.log('AUTH RESPONSE:', JSON.stringify(auth.data, null, 2));

    // 4️⃣ Test setBaseFlows endpoint
    console.log('\n🧪 Testing setBaseFlows endpoint...');
    const baseFlowsResponse = await axios.post(`${BASE}/setBaseFlows`, {
      clientID: 'ShNPvE',
      brand: brand
    });
    
    console.log('SET BASE FLOWS RESPONSE:', JSON.stringify(baseFlowsResponse.data, null, 2));

  } catch (err) {
    // Pretty-print errors
    const code = err.response?.status || 'ERR';
    console.error(`❌ [${code}]`, err.response?.data || err.message);
  }
}

runTests();
