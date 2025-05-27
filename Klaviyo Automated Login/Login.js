import 'dotenv/config';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import FileCookieStore from 'tough-cookie-file-store';
import FormData from 'form-data';
import { authenticator } from 'otplib';
import TwoCaptcha from '@2captcha/captcha-solver';
import crypto from 'crypto';

//------------------------------------
// Environment Variables & Constants
//------------------------------------
const KLAVIYO_LOGIN_URL = 'https://www.klaviyo.com/login';
const KLAVIYO_LOGIN_AJAX_URL = 'https://www.klaviyo.com/ajax/login';
const KLAVIYO_LOGIN_MFA_URL = 'https://www.klaviyo.com/ajax/login-mfa';
const KLAVIYO_AUTH_URL = 'https://www.klaviyo.com/ajax/authorization';
const CAPTCHA_API_KEY = '06a497b12e136fc2b76b3b551a0d0a2a';
const KLAVIYO_RECAPTCHA_SITE_KEY = '6Lcr3W4qAAAAAIuLNHTx1SA8DNCksiR504QiqTP8';
const KLAVIYO_EMAIL = 'kaloyan@bbb-marketing.com';
const KLAVIYO_PASSWORD = 'Nasko123$%^';
const KLAVIYO_MFA_SECRET = 'CC5MV2ZBQ2B4FZBJ';
const COOKIE_FILE_PATH = `./${KLAVIYO_EMAIL}_cookies.json`;
const DEBUG = false;

// Helper function to format timestamp
function getFormattedTimestamp() {
  const now = new Date();
  const dateTimeString = now.toLocaleString('en-US');
  
  return `${dateTimeString}`;
}

//------------------------------------
// Setup a single Axios instance
//------------------------------------
const cookieStore = new FileCookieStore(COOKIE_FILE_PATH);
const cookieJar = new CookieJar(cookieStore);
const axiosInstance = wrapper(
  axios.create({
    jar: cookieJar,
    withCredentials: true, // allow sending cookies
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  })
);

//------------------------------------
// 2Captcha solver
//------------------------------------
const solver = new TwoCaptcha.Solver(CAPTCHA_API_KEY);

//------------------------------------
// Utility: Delay
//------------------------------------
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//------------------------------------
// Generate a "fingerprint"
//------------------------------------
function generateCustomId() {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now().toString(16);
  const combined = `${uuid}${timestamp}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  return hash; // 64-char hex string
}

//------------------------------------
// 1) GET /login to gather cookies
//------------------------------------
async function getLoginPage() {
  try {
    const response = await axiosInstance.get(KLAVIYO_LOGIN_URL);

    // Just for debugging, show some info about set-cookies
    if (DEBUG && response.headers['set-cookie']) {
      console.log('Set-Cookie headers from GET /login:');
      console.log(response.headers['set-cookie']);
    }

    // Optional: check if page loaded properly, parse for any hidden fields, etc.

    // Return the cookies (although the cookieJar is storing them anyway)
    const cookies = await cookieJar.getCookies(KLAVIYO_LOGIN_URL);
    return cookies;
  } catch (error) {
    console.error('Error fetching Klaviyo login page:', error);
    throw error;
  }
}

//------------------------------------
// 2) Solve reCAPTCHA via 2Captcha
//------------------------------------
async function solveRecaptcha() {
  try {
    console.log('Solving captcha...');
    const result = await solver.recaptcha({
      pageurl: KLAVIYO_LOGIN_URL,
      googlekey: KLAVIYO_RECAPTCHA_SITE_KEY,
    });

    // result.data is the token
    if (DEBUG) console.log('reCAPTCHA token obtained:', result.data);
    console.log('Captcha solved!');
    return result.data;
  } catch (err) {
    console.log('Failed to solve reCAPTCHA:', err);
    throw err;
  }
}

//------------------------------------
// 3) Perform /ajax/login
//------------------------------------
async function doLogin(recaptchaToken) {
  if (DEBUG) console.log('Submitting login form...');

  // Grab the CSRF token from cookies: "kl_csrftoken"
  const allCookies = await cookieJar.getCookies(KLAVIYO_LOGIN_URL);
  const csrfCookie = allCookies.find((c) => c.key === 'kl_csrftoken');
  const csrfToken = csrfCookie ? csrfCookie.value : null;

  if (!csrfToken) {
    throw new Error('CSRF cookie not found. Cannot proceed with login.');
  }

  // Prepare form data
  const fingerprint = generateCustomId();
  if (DEBUG) console.log('Generated fingerprint:', fingerprint);

  const form = new FormData();
  form.append('email', KLAVIYO_EMAIL);
  form.append('password', KLAVIYO_PASSWORD);
  form.append('g-recaptcha-response', recaptchaToken);
  form.append('fingerprint', fingerprint);

  try {
    const response = await axiosInstance.post(KLAVIYO_LOGIN_AJAX_URL, form, {
      headers: {
        ...form.getHeaders(),
        'X-CSRFToken': csrfToken,
        'X-I18n-Lazy-Translation': 'true',
        Referer: KLAVIYO_LOGIN_URL,
        Origin: 'https://www.klaviyo.com',
      },
    });

    // Check the response
    if (DEBUG) {
      console.log('Login Response Data:', JSON.stringify(response.data, null, 2));
    }

    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

//------------------------------------
// 4) Submit MFA (TOTP) code
//------------------------------------
async function doMFA(retryCount = 0) {
  if (DEBUG) console.log('Submitting MFA code...');

  // Grab the CSRF token again (cookies might have changed)
  const allCookies = await cookieJar.getCookies(KLAVIYO_LOGIN_URL);
  const csrfCookie = allCookies.find((c) => c.key === 'kl_csrftoken');
  const csrfToken = csrfCookie ? csrfCookie.value : null;

  if (!csrfToken) {
    throw new Error('CSRF cookie not found. Cannot proceed with MFA.');
  }

  try {
    // Generate current TOTP code
    authenticator.options = {
      step: 30,
      digits: 6,
      algorithm: 'sha1',
    };
    const mfaCode = authenticator.generate(KLAVIYO_MFA_SECRET);

    if (DEBUG) console.log('Generated TOTP code:', mfaCode);

    // Prepare the form data
    const form = new FormData();
    form.append('mfa_code', mfaCode);
    form.append('mfa_type', 'totp');
    form.append('next', '/dashboard');

    const response = await axiosInstance.post(KLAVIYO_LOGIN_MFA_URL, form, {
      headers: {
        ...form.getHeaders(),
        'X-CSRFToken': csrfToken,
        'X-I18n-Lazy-Translation': 'true',
        Referer: 'https://www.klaviyo.com/login-mfa?next=/dashboard',
      },
    });

    if (DEBUG) {
      console.log('MFA Response Data:', JSON.stringify(response.data, null, 2));
    }

    if (response.data?.success === true) {
      console.log('MFA solved!');
      return true;
    } else {
      console.warn('MFA verification failed - success flag not true');
      return false;
    }
  } catch (error) {
    console.error('MFA submission failed:', error.response?.data || error.message);
    
    // Implement retry logic
    if (retryCount < 3) { // Allow up to 4 attempts (initial + 3 retries)
      console.log(`Retrying MFA submission in 5 seconds... (Attempt ${retryCount + 2}/4)`);
      await delay(5000); // Wait 5 seconds
      return doMFA(retryCount + 1);
    }
    
    // If we've exhausted all retries, throw the error
    throw new Error(`MFA failed after 4 attempts: ${error.message}`);
  }
}

//------------------------------------
// Step 5) Check Login Status
//------------------------------------
async function verifyLogin() {
  try {
    const response = await axiosInstance.get(KLAVIYO_AUTH_URL, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        priority: 'u=1, i',
        'sec-ch-ua':
          '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        referer: 'https://www.klaviyo.com/dashboard',
      },
    });

    if (DEBUG) {
      console.log('Authorization endpoint response:', JSON.stringify(response.data, null, 2));
    }

    if (response.status === 200 && response.data) {
      console.log('\x1b[32m✔ Login successful!\x1b[0m');
      return true;
    } else {
      console.log('\x1b[31m✖ Verification might have failed, unexpected response format.\x1b[0m');
      return false;
    }
  } catch (error) {
    console.error('Error verifying login:', error);
    throw error;
  }
}

//------------------------------------
// Main Flow
//------------------------------------
async function executeKlaviyoLogin(retryCount = 0) {
  const timestamp = getFormattedTimestamp();
  console.log(`${timestamp} Starting Klaviyo automated login...`);
  
  const startTime = Date.now();
  try {
    console.log('Initializing login...');
    await getLoginPage();
    const recaptchaToken = await solveRecaptcha();
    const loginResult = await doLogin(recaptchaToken);

    // If "redirect_url" includes login-mfa, we do MFA
    if (loginResult?.data?.redirect_url?.includes('login-mfa')) {
      if (DEBUG) console.log('MFA required, proceeding...');
      const mfaSuccess = await doMFA();
      if (!mfaSuccess) {
        throw new Error('MFA verification failed');
      }
    } else {
      console.log('No MFA required. Checking login status...');
    }

    // Perform final verification
    const verificationSuccess = await verifyLogin();
    if (!verificationSuccess) {
      throw new Error('Login verification failed');
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\x1b[32mTask Completed in ${duration.toFixed(2)} seconds 🥳\x1b[0m`);
    console.log(`${getFormattedTimestamp()} Klaviyo login completed successfully!`);
    await delay(500);
    return true;

  } catch (error) {
    console.error(`${getFormattedTimestamp()} Klaviyo login failed:`, error.message);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\x1b[31mTask Failed in ${duration.toFixed(2)} seconds\x1b[0m`);
    
    // Implement retry logic - retry up to 3 times with 1-minute delays
    if (retryCount < 30) {
      const nextRetry = retryCount + 1;
      console.log(`${getFormattedTimestamp()} Retrying in 1 minute... (Attempt ${nextRetry}/3)`);
      
      // Wait 1 minute before retrying
      await delay(60000);
      
      // Recursive retry
      return executeKlaviyoLogin(nextRetry);
    } else {
      console.error(`${getFormattedTimestamp()} All retry attempts failed. Will try again in 23 hours.`);
      return false;
    }
  }
}

// Function to start the recurring execution
function startRecurringExecution() {
  const INTERVAL_HOURS = 23;
  const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000; // 23 hours in milliseconds
  
  console.log(`Starting Klaviyo automated login script...`);
  console.log(`Will run every ${INTERVAL_HOURS} hours`);
  
  // Run immediately on start
  executeKlaviyoLogin();
  
  // Schedule recurring execution
  setInterval(() => {
    console.log(`\n--- Scheduled execution (every ${INTERVAL_HOURS} hours) ---`);
    executeKlaviyoLogin();
  }, INTERVAL_MS);
  
  const nextExecution = new Date(Date.now() + INTERVAL_MS);
  console.log(`\x1b[33mNext execution scheduled for ${nextExecution.toLocaleString()}\x1b[0m`);
}

// Start the recurring execution
startRecurringExecution();
