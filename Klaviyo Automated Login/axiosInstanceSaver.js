import fs from 'fs';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import FileCookieStore from 'tough-cookie-file-store';

//------------------------------------
// Axios Instance Saver/Loader
//------------------------------------

/**
 * Save complete axios instance state to file
 */
export async function saveAxiosInstance(axiosInstance, cookieJar, filePath = 'saved_axios_instance.json') {
  try {
    //console.log('💾 Saving complete axios instance state...');
    
    // Extract all axios configuration
    const instanceState = {
      // Basic axios config
      baseURL: axiosInstance.defaults.baseURL,
      timeout: axiosInstance.defaults.timeout,
      headers: axiosInstance.defaults.headers,
      withCredentials: axiosInstance.defaults.withCredentials,
      
      // Request/response transformers
      transformRequest: axiosInstance.defaults.transformRequest?.toString(),
      transformResponse: axiosInstance.defaults.transformResponse?.toString(),
      
      // Other axios defaults
      maxRedirects: axiosInstance.defaults.maxRedirects,
      validateStatus: axiosInstance.defaults.validateStatus?.toString(),
      
      // Cookies from the jar
      cookies: [],
      
      // Save timestamp
      savedAt: new Date().toISOString(),
      
      // Version info
      version: '1.0.0'
    };
    
    // Extract cookies from all domains
    const domains = ['https://www.klaviyo.com', 'https://klaviyo.com'];
    for (const domain of domains) {
      const cookies = await cookieJar.getCookies(domain);
      for (const cookie of cookies) {
        instanceState.cookies.push({
          key: cookie.key,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          hostOnly: cookie.hostOnly,
          creation: cookie.creation,
          lastAccessed: cookie.lastAccessed
        });
      }
    }
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(instanceState, null, 2));
    
    console.log(`✅ Axios instance saved to: ${filePath}`);
    //console.log(`📊 Saved ${instanceState.cookies.length} cookies`);
    //console.log(`📊 Saved headers:`, Object.keys(instanceState.headers).length);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving axios instance:', error.message);
    return false;
  }
}

/**
 * Load complete axios instance from saved state
 */
export async function loadAxiosInstance(filePath = 'saved_axios_instance.json') {
  try {
    console.log('📂 Loading axios instance from saved state...');
    const absolutePath = `${process.cwd()}/${filePath}`;
    filePath = absolutePath;
    
    console.log('✅ Found file at:', filePath);
    
    // Load the saved state
    const instanceState = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Create a temporary cookie file for this session
    const tempCookieFile = `./temp_cookies_${Date.now()}.json`;
    
    // Create cookie jar and populate with saved cookies
    const cookieStore = new FileCookieStore(tempCookieFile);
    const cookieJar = new CookieJar(cookieStore);
    
    // Add all saved cookies to the jar
    const cookiePromises = instanceState.cookies.map(async (cookieData) => {
      try {
        await cookieJar.setCookie(
          `${cookieData.key}=${cookieData.value}; Domain=${cookieData.domain}; Path=${cookieData.path}; ${cookieData.secure ? 'Secure;' : ''} ${cookieData.httpOnly ? 'HttpOnly;' : ''} SameSite=${cookieData.sameSite || 'none'}`,
          `https://${cookieData.domain.replace(/^\./, '')}`
        );
      } catch (err) {
        console.warn(`⚠️ Failed to set cookie ${cookieData.key}:`, err.message);
      }
    });
    
    // Wait for all cookies to be set
    await Promise.all(cookiePromises);
    
    // Merge headers properly - ensure all critical headers are included
    const completeHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'priority': 'u=1, i',
      'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'referer': 'https://www.klaviyo.com/dashboard',
      // Add any saved headers
      ...instanceState.headers
    };
    
    // Create axios instance with saved configuration
    const axiosInstance = wrapper(
      axios.create({
        jar: cookieJar,
        baseURL: instanceState.baseURL,
        timeout: instanceState.timeout || 0,
        headers: completeHeaders,
        withCredentials: instanceState.withCredentials !== false,
        maxRedirects: instanceState.maxRedirects || 5,
      })
    );
    
    // Clean up temp cookie file after a delay
    setTimeout(() => {
      try {
        fs.unlinkSync(tempCookieFile);
      } catch (err) {
        // Ignore cleanup errors
      }
    }, 1000);
    
    console.log('✅ Axios instance loaded successfully!');
    
    return {
      axiosInstance,
      cookieJar,
      savedAt: instanceState.savedAt,
      cookieCount: instanceState.cookies.length
    };
    
  } catch (error) {
    console.error('❌ Error loading axios instance:', error.message);
    return null;
  }
}

/**
 * Test if saved axios instance is still valid
 */
export async function testSavedInstance(filePath = 'saved_axios_instance.json') {
  try {
    const loaded = await loadAxiosInstance(filePath);
    if (!loaded) {
      return false;
    }
    
    console.log('🔍 Testing saved axios instance...');
    
    // Test with Klaviyo auth endpoint
    const response = await loaded.axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
    
    if (response.status === 200 && response.data && typeof response.data === 'object' && response.data.success === true) {
      //console.log('✅ Saved instance is valid! Authenticated as:', response.data.data.email);
      console.log(JSON.stringify(response.data, null, 2));
      return {
        valid: true,
        email: response.data.data.email,
        axiosInstance: loaded.axiosInstance,
        cookieJar: loaded.cookieJar
      };
    } else {
      console.log('❌ Saved instance is invalid');
      return { valid: false };
    }
    
  } catch (error) {
    console.log('❌ Error testing saved instance:', error.message);
    return { valid: false };
  }
} 