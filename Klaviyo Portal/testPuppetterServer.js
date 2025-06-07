// testKlaviyoPuppeteerService.js
import axios from 'axios';

const BASE = 'http://138.68.69.38:3002';   // Puppeteer server port

async function runTests() {
  try {
    console.log('🧪 Testing Klaviyo Puppeteer Server...\n');

    // 1️⃣ Status
    console.log('1️⃣ Testing /status endpoint...');
    const status = await axios.get(`${BASE}/status`);
    console.log('STATUS:', status.data);
    console.log('');

    // 2️⃣ Health Check (navigates to templates page and checks login)
    console.log('2️⃣ Testing /health endpoint...');
    const health = await axios.get(`${BASE}/health`);
    console.log('HEALTH:', health.data);
    console.log('');

    // 3️⃣ Check Login Action
    console.log('3️⃣ Testing /request with checklogin action...');
    const checkLogin = await axios.post(`${BASE}/request`, {
      action: 'checklogin'
    });
    console.log('CHECK LOGIN:', checkLogin.data);
    console.log('');

    // 4️⃣ Navigate to Templates Page
    console.log('4️⃣ Testing /request with goto action...');
    const goto = await axios.post(`${BASE}/request`, {
      action: 'goto',
      url: 'https://www.klaviyo.com/templates/list'
    });
    console.log('GOTO TEMPLATES:', goto.data);
    console.log('');

    // 5️⃣ Evaluate JavaScript (get page title)
    console.log('5️⃣ Testing /request with evaluate action...');
    const evaluate = await axios.post(`${BASE}/request`, {
      action: 'evaluate',
      options: {
        script: '() => ({ title: document.title, url: window.location.href })'
      }
    });
    console.log('EVALUATE:', evaluate.data);
    console.log('');

    // 6️⃣ Take Screenshot
    console.log('6️⃣ Testing /request with screenshot action...');
    const screenshot = await axios.post(`${BASE}/request`, {
      action: 'screenshot',
      options: {
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 }
      }
    });
    console.log('SCREENSHOT:', {
      success: screenshot.data.success,
      screenshotLength: screenshot.data.screenshot ? screenshot.data.screenshot.length : 0
    });
    console.log('');

    // 7️⃣ Try to find and interact with search input (if logged in)
    if (health.data.logged) {
      console.log('7️⃣ Testing /request with type action (search input)...');
      try {
        const typeAction = await axios.post(`${BASE}/request`, {
          action: 'type',
          selector: 'input.TextInput-input[role="combobox"][placeholder="Search"]',
          options: {
            text: 'test search'
          }
        });
        console.log('TYPE ACTION:', typeAction.data);
      } catch (e) {
        console.log('TYPE ACTION FAILED:', e.response?.data || e.message);
      }
      console.log('');

      console.log('8️⃣ Testing /request with click action (clear search if possible)...');
      try {
        const clickAction = await axios.post(`${BASE}/request`, {
          action: 'evaluate',
          options: {
            script: `() => {
              const searchInput = document.querySelector('input.TextInput-input[role="combobox"][placeholder="Search"]');
              if (searchInput) {
                searchInput.value = '';
                return { success: true, message: 'Search input cleared' };
              }
              return { success: false, message: 'Search input not found' };
            }`
          }
        });
        console.log('CLEAR SEARCH:', clickAction.data);
      } catch (e) {
        console.log('CLEAR SEARCH FAILED:', e.response?.data || e.message);
      }
      console.log('');
    }

    // 9️⃣ Save Cookies
    console.log('9️⃣ Testing /save endpoint...');
    const save = await axios.post(`${BASE}/save`);
    console.log('SAVE COOKIES:', save.data);
    console.log('');

    // 🔟 Reload Browser Instance
    console.log('🔟 Testing /reload endpoint...');
    const reload = await axios.post(`${BASE}/reload`);
    console.log('RELOAD:', reload.data);
    console.log('');

    // 1️⃣1️⃣ Final Status Check
    console.log('1️⃣1️⃣ Final status check...');
    const finalStatus = await axios.get(`${BASE}/status`);
    console.log('FINAL STATUS:', finalStatus.data);

    console.log('\n✅ All tests completed successfully!');

  } catch (err) {
    // Pretty-print errors
    const code = err.response?.status || 'ERR';
    console.error(`❌ [${code}]`, err.response?.data || err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the Puppeteer server is running on port 3002:');
      console.error('   npm run start:puppeteer');
    }
  }
}

// Run tests with some formatting
console.log('🚀 Starting Klaviyo Puppeteer Server Tests...');
console.log('=====================================\n');

runTests().then(() => {
  console.log('\n=====================================');
  console.log('🏁 Test run completed!');
}).catch(console.error); 