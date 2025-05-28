import axios from 'axios';

const BASE_URL = 'http://localhost:3002'; // Change if needed

async function checkStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/status`);
    console.log('✅ Service Status:', response.data);
  } catch (err) {
    console.error('❌ Error checking status:', err.message);
  }
}

async function checkHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data);
  } catch (err) {
    console.error('❌ Error checking health:', err.message);
  }
}

async function proxyGet(url, params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}/get`, { params: { url, ...params } });
    console.log(`✅ GET ${url}:`, response.data);
  } catch (err) {
    console.error(`❌ Error GET ${url}:`, err.message, err.response?.data);
  }
}

async function proxyPost(url, data = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/post`, { url, data });
    console.log(`✅ POST ${url}:`, response.data);
  } catch (err) {
    console.error(`❌ Error POST ${url}:`, err.message, err.response?.data);
  }
}

async function manualReload() {
  try {
    const response = await axios.post(`${BASE_URL}/reload`);
    console.log('🔄 Manual reload:', response.data);
  } catch (err) {
    console.error('❌ Error reloading instance:', err.message);
  }
}

// Example Usage
(async () => {
  //await checkStatus();
  //await checkHealth();
  //
  //// Example GET request
  //await proxyGet('https://www.klaviyo.com/ajax/authorization');
//
  //// Example POST request
  //await proxyPost('https://www.klaviyo.com/api/v1/some-endpoint', { key: 'value' });

  // Optional manual reload (if you want to trigger reload via API)
  // await manualReload();
})();
