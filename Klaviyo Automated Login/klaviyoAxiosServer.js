import express from 'express';
import fs from 'fs';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import FileCookieStore from 'tough-cookie-file-store';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

// ────────────────────────────────────────────────────
// Setup paths / env vars
// ────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT               = process.env.PORT ?? 3001;
const SAVED_INSTANCE     = process.env.AXIOS_STATE_FILE ?? path.join(__dirname,'saved_axios_instance.json');
const WATCH_INTERVAL_MS  = 60_000;
const ENABLE_CORS        = true;
const LOG_REQUESTS       = true;

let axiosInstance = null;
let cookieJar     = null;
let lastLoaded    = null;
let lastFileMod   = null;

// ────────────────────────────────────────────────────
// Logging util
// ────────────────────────────────────────────────────
function log(msg, type='INFO') {
  const t = new Date().toLocaleString('en-US');
  const c = {INFO:'\x1b[36m',SUCCESS:'\x1b[32m',WARN:'\x1b[33m',ERROR:'\x1b[31m',RESET:'\x1b[0m'};
  console.log(`${c[type]}[${t}] ${msg}${c.RESET}`);
}

// ────────────────────────────────────────────────────
// Load (or reload) axios instance from disk
// ────────────────────────────────────────────────────
async function loadAxiosInstance() {
  try {
    const state = JSON.parse(fs.readFileSync(SAVED_INSTANCE,'utf8'));

    const tmpFile = `./tmp_cookie_${Date.now()}.json`;
    const store   = new FileCookieStore(tmpFile);
    const jar     = new CookieJar(store);

    await Promise.all(state.cookies.map(c =>
      jar.setCookie(
        `${c.key}=${c.value}; Domain=${c.domain}; Path=${c.path}; ${c.secure?'Secure;':''}${c.httpOnly?'HttpOnly;':''}`,
        `https://${c.domain.replace(/^\./,'')}`
      ).catch(e=>log(`⚠️ cookie ${c.key}: ${e.message}`,'WARN'))
    ));

    // Extract CSRF token from cookies
    const csrfCookie = state.cookies.find(c => c.key === 'kl_csrftoken');
    const csrfToken = csrfCookie?.value || '';

    const headers = {
      'User-Agent': state.headers?.common?.['User-Agent'] || 'Mozilla/5.0',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US',
      'x-csrftoken': csrfToken,
      'referer': 'https://www.klaviyo.com',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      ...state.headers?.common                // saved defaults
    };

    axiosInstance = wrapper(axios.create({
      jar,
      headers,
      timeout      : state.timeout ?? 0,
      withCredentials : true,
      maxRedirects : 5
    }));
    cookieJar  = jar;
    lastLoaded = new Date().toISOString();
    log(`✅ Axios instance (re)loaded with CSRF: ${csrfToken ? csrfToken.substring(0,8)+'...' : 'none'}`,'SUCCESS');

    setTimeout(()=>fs.unlink(tmpFile,()=>{}),500);
  } catch (e) {
    log(`❌ loadAxiosInstance: ${e.message}`,'ERROR');
  }
}

// ────────────────────────────────────────────────────
// Persist current cookieJar back to file
// ────────────────────────────────────────────────────
async function persistCookies() {
  if (!cookieJar) return;
  try {
    const state     = JSON.parse(fs.readFileSync(SAVED_INSTANCE,'utf8'));
    state.cookies   = (await cookieJar.serialize()).cookies;
    state.savedAt   = new Date().toISOString();
    fs.writeFileSync(SAVED_INSTANCE,JSON.stringify(state,null,2));
    log('💾 Cookies persisted to disk','INFO');
  } catch(e) {
    log(`⚠️ persistCookies: ${e.message}`,'WARN');
  }
}

// ────────────────────────────────────────────────────
// Watch for external file updates
// ────────────────────────────────────────────────────
function watchFile() {
  if (!fs.existsSync(SAVED_INSTANCE)) return;
  lastFileMod = fs.statSync(SAVED_INSTANCE).mtime.getTime();

  fs.watchFile(SAVED_INSTANCE,{interval:WATCH_INTERVAL_MS}, async (cur,prev)=>{
    if (cur.mtime.getTime() !== lastFileMod) {
      await new Promise(r=>setTimeout(r,50_000)); // 50 s safety
      lastFileMod = cur.mtime.getTime();
      log('📄 Detected state-file change → hot reload','INFO');
      await loadAxiosInstance();
    }
  });
  log('👁️ File watcher running','INFO');
}

// ────────────────────────────────────────────────────
// Express app
// ────────────────────────────────────────────────────
const app = express();
app.use(express.json({limit:'10mb'}));

if (ENABLE_CORS) app.use(cors());
app.use(rateLimit({windowMs:10_000,max:300000})); // simple burst limiter

// ── Status
app.get('/status',(_,res)=>res.json({
  status: axiosInstance?'READY':'NOT_LOADED',
  lastLoaded, lastFileMod: new Date(lastFileMod).toISOString()
}));

// ── Health check
app.get('/health', async (_,res)=>{
  if (!axiosInstance) return res.status(500).json({error:'not_loaded'});
  try {
    const r = await axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
    return r.data?.success
      ? res.json({success:true,email:r.data.data.email,status:'\x1b[32mHEALTHY\x1b[0m'})
      : res.status(401).json({success:false});
  } catch(e) {
    res.status(500).json({error:e.message});
  }
});

// ── Universal proxy
app.post('/request', async (req,res)=>{
  if (!axiosInstance) return res.status(500).json({error:'not_loaded'});
  const {method='GET',url,headers={},params={},data=null,timeout,isFormData=false,fileData=null} = req.body || {};
  if (!url) return res.status(400).json({error:'url required'});
  
  if (LOG_REQUESTS) {
    const rawIp = req.ip || req.connection.remoteAddress;
    const ip = rawIp?.replace(/^::ffff:/, '') || 'unknown';
    log(`📡 ${method.toUpperCase()} ${url} (IP: ${ip})`, 'INFO');
  }

  try {
    let requestData = data;
    let requestHeaders = {...axiosInstance.defaults.headers.common, ...headers};

    // Handle FormData for file uploads
    if (isFormData && fileData) {
      const formData = new FormData();
      
      // Add the file
      if (fileData.filename && fileData.buffer) {
        const buffer = Buffer.from(fileData.buffer, 'base64');
        formData.append('upload_file', buffer, fileData.filename);
      }
      
      // Add other form fields
      if (data) {
        Object.keys(data).forEach(key => {
          if (key !== 'upload_file') {
            formData.append(key, data[key]);
          }
        });
      }
      
      requestData = formData;
      requestHeaders = {
        ...requestHeaders,
        ...formData.getHeaders()
      };
      
      // Remove content-type if it was set, let FormData set it
      delete requestHeaders['content-type'];
    }

    const response = await axiosInstance.request({
      method: method.toUpperCase(),
      url, 
      params, 
      data: requestData, 
      timeout,
      headers: requestHeaders
    });

    res.status(response.status).send(response.data);
  } catch(e) {
    res.status(e.response?.status||500).json({
      error:e.message,
      data : e.response?.data
    });
  }
}); 

// manual reload
app.post('/reload', async (_,res)=>{
  await loadAxiosInstance();
  res.json({message:'reloaded',lastLoaded});
});

// Manually write current jar to disk once
app.post('/save', async (_, res) => {
  await persistCookies();                // writes file
  lastFileMod = fs.statSync(SAVED_INSTANCE).mtime.getTime(); // refresh baseline
  res.json({saved: true});
});


// ────────────────────────────────────────────────────
// Init
// ────────────────────────────────────────────────────
(async()=>{
  await loadAxiosInstance();
  watchFile();
  app.listen(PORT,()=>log(`🚀 Klaviyo-proxy on http://localhost:${PORT}`,'SUCCESS'));
})();
