// Your DigitalOcean droplet IP
const localURL = 'http://localhost:3000';
const SERVER_URL = 'http://138.68.69.38:3000';
const testMethod = 'accept_klaviyo_invitation'; // scrape_brand_brief or scrape_html or extract_best_sellers or klaviyo_login or klaviyo_cookies or accept_klaviyo_invitation or both
const test = SERVER_URL;
const includeBrandData = true; // Set to true to include brand data analysis, false to exclude it

// API key for Klaviyo cookies endpoint
const KLAVIYO_COOKIES_API_KEY = 'klaviyo-a7f9e2b8c4d6f1a3e9b7c5d2f8a4e6b9c1d7f3a5e8b2c6d9f4a1e7b3c8d5f2a9';

// Test script for the scraper server
const testUrl = 'https://siliconwives.com'; // Replace with any website you want to test

async function testScraper() {
  try {

    if (testMethod === 'scrape_brand_brief') {
        // Test brand brief scraping
        console.log('\nTesting brand brief scraping...');
        const briefResponse = await fetch(`${test}/scrape`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            method: 'scrape_brand_brief',
            url: testUrl,
            includeBrandData: includeBrandData
        })
        });

        if (!briefResponse.ok) {
            throw new Error(`HTTP error! status: ${briefResponse.status}\n Full error: ${briefResponse.statusText}`);
        }
        
        const briefData = await briefResponse.json();
        console.log('Brand brief scraping result:', briefData.ok ? 'Success' : 'Failed');
        if (briefData.ok) {
        console.log('Brand brief data:', JSON.stringify(briefData.data, null, 2));
        } else {
        console.log('Error:', briefData.error);
        }
    }

    if (testMethod === 'scrape_html') {
        // Test simple HTML scraping
        console.log('\nTesting simple HTML scraping...');
        const htmlResponse = await fetch(`${test}/scrape`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            method: 'scrape_html',
            url: testUrl
        })
        });

        const htmlData = await htmlResponse.json();
        console.log('HTML scraping result:', htmlData.ok ? 'Success' : 'Failed');
        if (htmlData.ok) {
        // Log a snippet or length to confirm HTML was received
        console.log('Received HTML length:', htmlData.html?.length);
        } else {
        console.log('Error:', htmlData.error);
        }
    }

    if (testMethod === 'extract_best_sellers') {
        // Test extractBestSellers method via /scrape endpoint
        console.log('\nTesting extractBestSellers method via /scrape endpoint...');
        const bestSellersResponse = await fetch(`${test}/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'extractBestSellers',
            url: testUrl
          })
        });

        const bestSellersData = await bestSellersResponse.json();
        console.log('extractBestSellers result:', bestSellersData.ok ? 'Success' : 'Failed');
        if (bestSellersData.ok) {
          console.log('Best sellers data:', JSON.stringify(bestSellersData.data, null, 2));
        } else {
          console.log('Error:', bestSellersData.error);
        }
    }

    if (testMethod === 'klaviyo_login') {
        // Test Klaviyo login and cookie retrieval
        console.log('\nTesting Klaviyo login and cookie retrieval...');
        const startTime = Date.now();
        
        const klaviyoResponse = await fetch(`${test}/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'klaviyo_login',
            url: 'https://www.klaviyo.com' // URL not really used for login but required by endpoint
          })
        });

        const klaviyoData = await klaviyoResponse.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`Klaviyo login result: ${klaviyoData.ok ? 'Success' : 'Failed'} (${elapsed}s)`);
        if (klaviyoData.ok) {
          console.log('Login message:', klaviyoData.data.message);
          console.log('Number of cookies received:', klaviyoData.data.cookies.length);
          console.log('\nKlaviyo cookies:');
          klaviyoData.data.cookies.forEach((cookie, index) => {
            console.log(`  ${index + 1}. ${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
            console.log(`     Domain: ${cookie.domain}, Path: ${cookie.path}`);
            console.log(`     Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}`);
            if (cookie.expires) {
              console.log(`     Expires: ${new Date(cookie.expires).toISOString()}`);
            }
            console.log('');
          });
        } else {
          console.log('Error:', klaviyoData.error);
        }
    }

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

    if (testMethod === 'accept_klaviyo_invitation') {
        // Test Klaviyo invitation acceptance
        console.log('\nTesting Klaviyo invitation acceptance...');
        const startTime = Date.now();
        
        const invitationUrl = 'https://www.klaviyo.com/ajax/account/confirm/S6vKFe/SRsJn8/cr4fws-791b1416fc5794b82fa6/accept';
        
        const invitationResponse = await fetch(`${test}/acceptKlaviyoInvitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: invitationUrl
          })
        });

        const invitationData = await invitationResponse.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`Klaviyo invitation acceptance result: ${invitationData.ok ? 'Success' : 'Failed'} (${elapsed}s)`);
        
        if (invitationData.ok) {
          console.log(`\n✅ Invitation Response:`);
          console.log(`   Message: ${invitationData.message}`);
          console.log(`   Final URL: ${invitationData.finalUrl}`);
          console.log(`   Page Title: ${invitationData.pageTitle}`);
        } else {
          console.log('❌ Error:', invitationData.error);
        }
    }

    if (testMethod === 'both') {
        // Start both fetches simultaneously
        console.log('\nTesting scrape_brand_brief and extractBestSellers simultaneously...');
        const briefPromise = fetch(`${test}/scrape`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'scrape_brand_brief',
                url: testUrl,
                includeBrandData: includeBrandData
            })
        });
        const bestSellersPromise = fetch(`${test}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'extractBestSellers',
                url: testUrl
            })
        });

        // Print each result as soon as it's ready
        let briefDone = false;
        let bestSellersDone = false;

        briefPromise.then(async (briefResponse) => {
            const briefData = await briefResponse.json();
            console.log('Brand brief scraping result:', briefData.ok ? 'Success' : 'Failed');
            if (briefData.ok) {
                console.log('Brand brief data:', JSON.stringify(briefData.data, null, 2));
            } else {
                console.log('Error:', briefData.error);
            }
            briefDone = true;
            if (bestSellersDone) console.log('Both requests complete.');
        });

        bestSellersPromise.then(async (bestSellersResponse) => {
            const bestSellersData = await bestSellersResponse.json();
            console.log('extractBestSellers result:', bestSellersData.ok ? 'Success' : 'Failed');
            if (bestSellersData.ok) {
                console.log('Best sellers data:', JSON.stringify(bestSellersData.data, null, 2));
            } else {
                console.log('Error:', bestSellersData.error);
            }
            bestSellersDone = true;
            if (briefDone) console.log('Both requests complete.');
        });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testScraper(); 