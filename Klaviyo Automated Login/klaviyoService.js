import express from 'express';
import fs from 'fs';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import FileCookieStore from 'tough-cookie-file-store';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const SAVED_INSTANCE_PATH = path.join(__dirname, 'saved_axios_instance.json');
const PORT = 3002;
const WATCH_INTERVAL = 60 * 1000; // 1 min

let axiosInstance = null;
let cookieJar = null;
let lastLoaded = null;
let lastFileModified = null;

// Utility to log
function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('en-US');
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARN: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.RESET}`);
}

// Load axios instance from file
async function loadAxiosInstance() {
  try {
    log('📂 Loading axios instance...');
    const instanceState = JSON.parse(fs.readFileSync(SAVED_INSTANCE_PATH, 'utf8'));

    const tempCookieFile = `./temp_cookies_${Date.now()}.json`;
    const store = new FileCookieStore(tempCookieFile);
    const jar = new CookieJar(store);

    const cookiePromises = instanceState.cookies.map(cookieData =>
      jar.setCookie(
        `${cookieData.key}=${cookieData.value}; Domain=${cookieData.domain}; Path=${cookieData.path}; ${cookieData.secure ? 'Secure;' : ''} ${cookieData.httpOnly ? 'HttpOnly;' : ''}`,
        `https://${cookieData.domain.replace(/^\./, '')}`
      ).catch(err => log(`⚠️ Failed to set cookie ${cookieData.key}: ${err.message}`, 'WARN'))
    );
    await Promise.all(cookiePromises);

    const headers = {
      'User-Agent': instanceState.headers?.common?.['User-Agent'] || 'Mozilla/5.0',
      ...instanceState.headers?.common
    };

    const instance = wrapper(axios.create({
      jar,
      timeout: instanceState.timeout || 0,
      headers,
      withCredentials: true,
      maxRedirects: 5
    }));

    // Replace old instance and jar atomically
    axiosInstance = instance;
    cookieJar = jar;
    lastLoaded = new Date().toISOString();
    log('✅ Axios instance loaded successfully!', 'SUCCESS');

    // Cleanup temp cookie file
    setTimeout(() => fs.unlink(tempCookieFile, () => {}), 1000);
  } catch (error) {
    log(`❌ Error loading axios instance: ${error.message}`, 'ERROR');
  }
}

// Setup file watcher to auto-reload instance
function watchInstanceFile() {
  try {
    if (fs.existsSync(SAVED_INSTANCE_PATH)) {
      const stats = fs.statSync(SAVED_INSTANCE_PATH);
      lastFileModified = stats.mtime.getTime();
    }

    fs.watchFile(SAVED_INSTANCE_PATH, { interval: WATCH_INTERVAL }, async (curr, prev) => {
      if (curr.mtime.getTime() !== lastFileModified) {
        log('📄 Detected file change - reloading instance...', 'INFO');
        lastFileModified = curr.mtime.getTime();
        await loadAxiosInstance();
      }
    });

    log('👁️ File watcher started', 'INFO');
  } catch (error) {
    log(`⚠️ Failed to set up file watcher: ${error.message}`, 'WARN');
  }
}

// Express app setup
const app = express();
app.use(express.json());

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: axiosInstance ? 'READY' : 'NOT_LOADED',
    lastLoaded,
    lastFileModified: new Date(lastFileModified).toISOString()
  });
});

// Health check (test current session)
app.get('/health', async (req, res) => {
  if (!axiosInstance) return res.status(500).json({ error: 'Axios instance not loaded' });
  try {
    const response = await axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
    if (response.data?.success) {
      res.json({ success: true, email: response.data.data.email });
    } else {
      res.status(401).json({ success: false, message: 'Session invalid' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy GET request
app.get('/get', async (req, res) => {
  if (!axiosInstance) return res.status(500).json({ error: 'Axios instance not loaded' });
  const { url, ...query } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const response = await axiosInstance.get(url, { params: query });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message, data: err.response?.data });
  }
});

// Proxy POST request
app.post('/post', async (req, res) => {
  if (!axiosInstance) return res.status(500).json({ error: 'Axios instance not loaded' });
  const { url, data } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url in body' });
  try {
    const response = await axiosInstance.post(url, data);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message, data: err.response?.data });
  }
});

// Force reload instance
app.post('/reload', async (req, res) => {
  await loadAxiosInstance();
  res.json({ message: 'Instance reloaded', lastLoaded });
});

// Start the service
(async () => {
  await loadAxiosInstance();
  watchInstanceFile();
  app.listen(PORT, () => {
    log(`🚀 Klaviyo Service running at http://localhost:${PORT}`, 'SUCCESS');
  });
})();
