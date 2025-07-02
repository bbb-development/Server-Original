// Your DigitalOcean droplet IP
const localURL = 'http://localhost:3000';
const SERVER_URL = 'http://138.68.69.38:3000';
const testMethod = 'brandFetch'; // brandFetch or klaviyo_cookies or health
const test = SERVER_URL;
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const saveResults = true;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API key for Klaviyo cookies endpoint
const KLAVIYO_COOKIES_API_KEY = 'klaviyo-a7f9e2b8c4d6f1a3e9b7c5d2f8a4e6b9c1d7f3a5e8b2c6d9f4a1e7b3c8d5f2a9';

// Test script for the scraper server
const testUrl = 'https://siliconwives.com'; // Replace with any website you want to test

async function testScraper() {
  try {

    if (testMethod === 'brandFetch') {
        // Test brand analysis using new brandFetch endpoint
        console.log('\nTesting brand analysis with new brandFetch endpoint...');
        const startTime = Date.now();
        
        const brandResponse = await fetch(`${test}/brandFetch`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: testUrl,
                shouldGetBestSellers: true,
                options: {
                    mapOptions: {
                        limit: 500
                    }
                }
            })
        });

        if (!brandResponse.ok) {
            throw new Error(`HTTP error! status: ${brandResponse.status}\n Full error: ${brandResponse.statusText}`);
        }
        
        const brandData = await brandResponse.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`Brand analysis result: ${brandData.ok ? 'Success' : 'Failed'} (${elapsed}s)`);
        if (brandData.ok) {
            console.log(`\n📊 Analysis Summary:`);
            console.log(`   Processing Time: ${brandData.meta.processingTime.toFixed(2)}s`);
            console.log(`   Timestamp: ${brandData.meta.timestamp}`);
            console.log(`   Domain: ${brandData.data.domain}`);
            console.log(`   Total Pages: ${brandData.data.analysis.totalPages}`);
            console.log(`   Has Logo: ${brandData.data.analysis.hasLogo}`);
            console.log(`   Has Colors: ${brandData.data.analysis.hasColors}`);
            console.log(`   Benefits Count: ${brandData.data.analysis.benefitsCount}`);
            console.log(`   Best Sellers Count: ${brandData.data.analysis.bestSellersCount}`);
            console.log(`   Preview Emails: ${brandData.previewEmails.length}`);
            
            console.log('\n📋 Full Brand Data:');
            console.log(JSON.stringify(brandData.data, null, 2));
            
            console.log('\n📋 Preview Emails:');
            console.log(JSON.stringify(brandData.previewEmails, null, 2));
            
            if (saveResults) {
                const outputPath = join(__dirname, './test_brand_data.json');
                writeFileSync(outputPath, JSON.stringify(brandData, null, 2));
                console.log(`💾 Results saved to ${outputPath}`);
            }
        } else {
            console.log('❌ Error:', brandData.error);
        }
    }

    if (testMethod === 'health') {
        // Test health endpoint
        console.log('\nTesting health endpoint...');
        const healthResponse = await fetch(`${test}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!healthResponse.ok) {
            throw new Error(`HTTP error! status: ${healthResponse.status}\n Full error: ${healthResponse.statusText}`);
        }

        const healthData = await healthResponse.json();
        console.log('Health check result:', healthData.ok ? 'Success' : 'Failed');
        if (healthData.ok) {
            console.log(`\n🏥 Server Health:`);
            console.log(`   Status: ${healthData.status}`);
            console.log(`   Uptime: ${(healthData.uptime / 60).toFixed(2)} minutes`);
            console.log(`   Timestamp: ${healthData.timestamp}`);
        } else {
            console.log('❌ Error:', healthData.error);
        }
    }

    // Note: klaviyo_login method is no longer available in the new brand-fetch-server
    // It was part of the old scraper server that included Playwright automation
    /*
    if (testMethod === 'klaviyo_login') {
        console.log('⚠️ klaviyo_login method is not available in the new brand-fetch-server');
        console.log('💡 Use klaviyo_cookies endpoint instead to get stored cookies');
    }
    */

    if (testMethod === 'klaviyo_cookies') {
        // Test Klaviyo cookies retrieval
        console.log('\nTesting Klaviyo cookies retrieval...');
        const startTime = Date.now();
        
        const cookiesResponse = await fetch(`${test}/klaviyo-cookies`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KLAVIYO_COOKIES_API_KEY}`
          }
        });

        const cookiesData = await cookiesResponse.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`Klaviyo cookies retrieval result: ${cookiesData.ok ? 'Success' : 'Failed'} (${elapsed}s)`);
        
        if (cookiesData.ok) {
          console.log(`\n📊 Cookie File Info:`);
          console.log(`   Last Updated: ${new Date(cookiesData.lastUpdated).toLocaleString()}`);
          console.log(`   File Size: ${cookiesData.fileSize} bytes`);
          
          console.log(`\n🍪 Cookie Content:`);
          console.log(JSON.stringify(cookiesData.cookies, null, 2));
          
          // Parse and display cookie summary
          const domains = Object.keys(cookiesData.cookies);
          console.log(`\n📋 Cookie Summary:`);
          console.log(`   Total Domains: ${domains.length}`);
          
          domains.forEach(domain => {
            const paths = Object.keys(cookiesData.cookies[domain]);
            console.log(`   • ${domain}:`);
            paths.forEach(path => {
              const cookies = Object.keys(cookiesData.cookies[domain][path]);
              console.log(`     Path "${path}": ${cookies.length} cookies`);
              cookies.forEach(cookieName => {
                const cookie = cookiesData.cookies[domain][path][cookieName];
                const expires = cookie.expires ? new Date(cookie.expires).toLocaleString() : 'Session';
                console.log(`       - ${cookieName}: expires ${expires}`);
              });
            });
          });
        } else {
          console.log('❌ Error:', cookiesData.error);
          if (cookiesResponse.status === 401) {
            console.log('💡 Tip: Check if the API key is correct and properly set in the .env file');
          }
        }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testScraper(); 