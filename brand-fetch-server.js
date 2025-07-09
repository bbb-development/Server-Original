import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { analyzeBrand } from './NEW Brand Fetch Method/brand-analyzer.js';
import { getAllTemplateHTML } from './Klaviyo Portal/Functions/Generate Preview Emails/functions/fetchKlaviyoTemplates.js';
import { generatePreviewEmails } from './Klaviyo Portal/Functions/Generate Preview Emails/main/generatePreviewEmails.js';
import { matchClientWithKlaviyo } from './Klaviyo Invitation Listener/connectProfile.js';
import { uploadImageToImgbb } from './NEW Brand Fetch Method/tools/imgBB Integration.js';
import multer from 'multer';
import { setupBaseStructure } from './Klaviyo Portal/Systems/Setup Base Structure (Create Flows Method).js';
import * as smallFunctions from './Klaviyo Portal/Functions/smallFunctions.js';

// Create logs directory if it doesn't exist
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Current request context for logging
let currentRequestContext = {
  brandUrl: null,
  requestId: null,
  startTime: null,
  requestLogFile: null
};

// Function to sanitize URL for filename
function sanitizeUrlForFilename(url) {
  return url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/^www\./, '') // Remove www
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

// Enhanced logging function
function writeToLogFile(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    requestId: currentRequestContext.requestId,
    brandUrl: currentRequestContext.brandUrl,
    ...context
  };
  
  // Format log entry for file
  const logLine = `[${timestamp}] [${level.toUpperCase()}] [${currentRequestContext.requestId || 'SERVER'}] [${currentRequestContext.brandUrl || 'N/A'}] ${message}\n`;
  
  // Write to daily log file
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dailyLogFileName = `brand-fetch-${dateStr}.log`;
  const dailyLogFilePath = path.join(logsDir, dailyLogFileName);
  fs.appendFileSync(dailyLogFilePath, logLine);
  
  // Write to request-specific log file if we're in a request context
  if (currentRequestContext.requestLogFile) {
    fs.appendFileSync(currentRequestContext.requestLogFile, logLine);
  }
}

// Override console methods to also log to file
console.log = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile('info', message);
  originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile('error', message);
  originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile('warn', message);
  originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  writeToLogFile('info', message);
  originalConsole.info.apply(console, args);
};

console.log('🚀 Initializing brand fetch server with enhanced logging...');

const app = express();

// Set up CORS with dynamic origin checking for security
const allowedOrigins = [
  'https://flow-fast.ai',
  'https://www.flow-fast.ai',
  'http://localhost:3000', // Common local dev ports
  'http://localhost:5173', // Vite's default port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// --> ENHANCED LOGGING MIDDLEWARE
app.use((req, res, next) => {
  const requestStart = Date.now();
  console.log('--- Incoming Request ---');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
  console.log('------------------------');
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - requestStart;
    console.log(`📤 Response: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

const upload = multer();

// Brand Fetch endpoint
app.post('/brandFetch', async (req, res) => {
  // Generate unique request ID and set context
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  currentRequestContext.requestId = requestId;
  currentRequestContext.startTime = Date.now();
  
  try {
    const { url, shouldGetBestSellers = false, options = {} } = req.body;
    
    if (!url) {
      console.error('❌ Missing required parameter: url');
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required parameter: url' 
      });
    }
    
    // Set brand URL in context for logging
    currentRequestContext.brandUrl = url;
    
    // Create request-specific log file
    const sanitizedUrl = sanitizeUrlForFilename(url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Make timestamp filename-safe
    const requestLogFileName = `${sanitizedUrl}_${timestamp}.log`;
    currentRequestContext.requestLogFile = path.join(logsDir, 'requests', requestLogFileName);
    
    // Create requests subdirectory if it doesn't exist
    const requestsDir = path.join(logsDir, 'requests');
    if (!fs.existsSync(requestsDir)) {
      fs.mkdirSync(requestsDir, { recursive: true });
    }
    
    console.log(`📥 Received brand fetch request for: ${url}`);
    console.log(`📊 Should get best sellers: ${shouldGetBestSellers}`);
    console.log(`🆔 Request ID: ${requestId}`);
    console.log(`📝 Request log file: ${requestLogFileName}`);
    console.log(`⚙️ Options:`, JSON.stringify(options));
    
    const startTime = Date.now();
    
    console.log('🔄 Starting parallel execution: Brand analysis + Klaviyo templates');
    const [brandData, klaviyoTemplates] = await Promise.all([
      analyzeBrand(url, shouldGetBestSellers, options),
      getAllTemplateHTML()
    ]);
    
    console.log('🎨 Starting preview email generation');
    const previewEmails = await generatePreviewEmails(brandData, klaviyoTemplates);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const dateString = now.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
    console.log(`✅ Brand analysis completed in ${duration} seconds at ${timeString} on ${dateString}`);
    
    // Log summary to file
    writeToLogFile('info', `SUMMARY - Request completed successfully`, {
      duration: duration,
      templatesGenerated: Object.keys(previewEmails || {}).length,
      hasProducts: !!(brandData?.products?.length),
      productCount: brandData?.products?.length || 0
    });
    
    res.status(200).json({ 
      ok: true, 
      data: brandData,
      previewEmails,
      meta: {
        processingTime: duration,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        logFile: requestLogFileName
      }
    });
  } catch (err) {
    console.error('❌ Brand fetch error:', err.message);
    console.error('❌ Stack trace:', err.stack);
    
    // Log error summary
    writeToLogFile('error', `SUMMARY - Request failed: ${err.message}`, {
      duration: currentRequestContext.startTime ? (Date.now() - currentRequestContext.startTime) / 1000 : 0,
      errorType: err.constructor.name
    });
    
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      logFile: requestLogFileName || null
    });
  } finally {
    // Log request completion
    if (currentRequestContext.requestLogFile) {
      console.log(`📁 Request-specific logs saved to: ${path.basename(currentRequestContext.requestLogFile)}`);
    }
    
    // Clear request context
    currentRequestContext.brandUrl = null;
    currentRequestContext.requestId = null;
    currentRequestContext.startTime = null;
    currentRequestContext.requestLogFile = null;
  }
});

// Add the connectKlaviyo endpoint
app.post('/connectKlaviyo', async (req, res) => {
  try {
    const supabaseClient = req.body;
    if (!supabaseClient || typeof supabaseClient !== 'object') {
      return res.status(400).json({ ok: false, error: 'Missing or invalid Supabase client data' });
    }
    const { matchResult, klaviyoClient } = await matchClientWithKlaviyo(supabaseClient);
    res.status(200).json({ 
      ok: true, 
      full_user_data: {
        matched_data: matchResult,
        klaviyo_data: klaviyoClient
      }
    });
  } catch (err) {
    console.error('❌ connectKlaviyo error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Klaviyo data endpoints - simplified to avoid regex issues
app.get('/klaviyo-cookies', (req, res) => handleKlaviyoRequest('cookies', req, res));
app.get('/klaviyo-instance', (req, res) => handleKlaviyoRequest('instance', req, res));

function handleKlaviyoRequest(type, req, res) {
  // Check API key authentication
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.KLAVIYO_COOKIES_ACCESS_API_KEY;
  console.log(`Fetching Klaviyo ${type}...`);
  
  if (!expectedKey) {
    return res.status(500).json({ 
      ok: false, 
      error: 'API key not configured on server' 
    });
  }
  
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    console.log("Unauthorized - Invalid or missing API key");
    return res.status(401).json({ 
      ok: false, 
      error: 'Unauthorized - Invalid or missing API key' 
    });
  }
  
  try {
    const cookiesFilePath = './Klaviyo Automated Login/kaloyan@bbb-marketing.com_cookies.json';
    const instanceFilePath = './Klaviyo Automated Login/saved_axios_instance.json';
    
    let filePath, fileType;
    if (type === 'cookies') {
      filePath = cookiesFilePath;
      fileType = 'cookies';
    } else if (type === 'instance') {
      filePath = instanceFilePath;
      fileType = 'axios instance';
    }
    
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(fileData);
      const stats = fs.statSync(filePath);
      
      if (type === 'cookies') {
        res.status(200).json({ 
          ok: true, 
          cookies: parsedData,
          lastUpdated: stats.mtime,
          fileSize: stats.size
        });
      } else {
        res.status(200).json({ 
          ok: true, 
          instance: parsedData,
          lastUpdated: stats.mtime,
          fileSize: stats.size
        });
      }
      console.log(`Klaviyo ${fileType} fetched successfully`);
    } else {
      res.status(404).json({ 
        ok: false, 
        error: `Klaviyo ${fileType} file not found`,
        expectedPath: filePath
      });
    }
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: `Failed to read ${type} file: ` + error.message 
    });
  }
}

// Daily logs viewing endpoint
app.get('/logs', (req, res) => {
  try {
    const { date, requestId, limit = 1000 } = req.query;
    
    // If specific date requested, use that; otherwise use today
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logFileName = `brand-fetch-${targetDate}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).json({
        ok: false,
        error: `No logs found for date: ${targetDate}`,
        availableDates: getAvailableLogDates(),
        requestLogs: getAvailableRequestLogs()
      });
    }
    
    let logContent = fs.readFileSync(logFilePath, 'utf-8');
    let logLines = logContent.split('\n').filter(line => line.trim());
    
    // Filter by request ID if provided
    if (requestId) {
      logLines = logLines.filter(line => line.includes(requestId));
    }
    
    // Limit the number of lines returned
    if (limit && logLines.length > limit) {
      logLines = logLines.slice(-limit); // Get the last N lines
    }
    
    // Parse log lines into structured format
    const parsedLogs = logLines.map(line => {
      const match = line.match(/^\[(.+?)\] \[(.+?)\] \[(.+?)\] \[(.+?)\] (.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          requestId: match[3],
          brandUrl: match[4],
          message: match[5]
        };
      }
      return { raw: line };
    });
    
    res.status(200).json({
      ok: true,
      type: 'daily',
      date: targetDate,
      requestId: requestId || null,
      totalLines: parsedLogs.length,
      logs: parsedLogs,
      availableDates: getAvailableLogDates(),
      requestLogs: getAvailableRequestLogs()
    });
    
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to read logs: ' + error.message
    });
  }
});

// Request-specific logs viewing endpoint
app.get('/logs/request/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const { limit = 1000 } = req.query;
    
    // Ensure filename ends with .log
    const logFileName = filename.endsWith('.log') ? filename : filename + '.log';
    const logFilePath = path.join(logsDir, 'requests', logFileName);
    
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).json({
        ok: false,
        error: `Request log file not found: ${logFileName}`,
        availableRequestLogs: getAvailableRequestLogs()
      });
    }
    
    let logContent = fs.readFileSync(logFilePath, 'utf-8');
    let logLines = logContent.split('\n').filter(line => line.trim());
    
    // Limit the number of lines returned
    if (limit && logLines.length > limit) {
      logLines = logLines.slice(-limit);
    }
    
    // Parse log lines into structured format
    const parsedLogs = logLines.map(line => {
      const match = line.match(/^\[(.+?)\] \[(.+?)\] \[(.+?)\] \[(.+?)\] (.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          requestId: match[3],
          brandUrl: match[4],
          message: match[5]
        };
      }
      return { raw: line };
    });
    
    // Get file stats
    const stats = fs.statSync(logFilePath);
    
    res.status(200).json({
      ok: true,
      type: 'request',
      filename: logFileName,
      totalLines: parsedLogs.length,
      logs: parsedLogs,
      fileSize: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
    
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to read request log: ' + error.message
    });
  }
});

// Get available log dates
function getAvailableLogDates() {
  try {
    const files = fs.readdirSync(logsDir);
    return files
      .filter(file => file.startsWith('brand-fetch-') && file.endsWith('.log'))
      .map(file => file.replace('brand-fetch-', '').replace('.log', ''))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    return [];
  }
}

// Get available request logs
function getAvailableRequestLogs() {
  try {
    const requestsDir = path.join(logsDir, 'requests');
    if (!fs.existsSync(requestsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(requestsDir);
    return files
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(requestsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified); // Most recent first
  } catch (error) {
    return [];
  }
}

// Log cleanup endpoint (optional - for maintenance)
app.delete('/logs/:date', (req, res) => {
  try {
    const { date } = req.params;
    const logFileName = `brand-fetch-${date}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
      console.log(`🗑️ Deleted log file: ${logFileName}`);
      res.status(200).json({
        ok: true,
        message: `Log file for ${date} deleted successfully`
      });
    } else {
      res.status(404).json({
        ok: false,
        error: `No log file found for date: ${date}`
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to delete log file: ' + error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const logStats = getLogStats();
  res.status(200).json({
    ok: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    logging: {
      enabled: true,
      logsDirectory: logsDir,
      ...logStats
    }
  });
});

// Get log statistics
function getLogStats() {
  try {
    // Daily logs
    const files = fs.readdirSync(logsDir);
    const dailyLogFiles = files.filter(file => file.startsWith('brand-fetch-') && file.endsWith('.log'));
    
    let dailyTotalSize = 0;
    const dailyFileStats = dailyLogFiles.map(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      dailyTotalSize += stats.size;
      return {
        file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    // Request logs
    const requestLogs = getAvailableRequestLogs();
    const requestTotalSize = requestLogs.reduce((sum, log) => sum + log.size, 0);
    
    return {
      daily: {
        totalFiles: dailyLogFiles.length,
        totalSizeBytes: dailyTotalSize,
        totalSizeMB: (dailyTotalSize / 1024 / 1024).toFixed(2),
        files: dailyFileStats.sort((a, b) => b.modified - a.modified)
      },
      requests: {
        totalFiles: requestLogs.length,
        totalSizeBytes: requestTotalSize,
        totalSizeMB: (requestTotalSize / 1024 / 1024).toFixed(2),
        files: requestLogs
      },
      combined: {
        totalFiles: dailyLogFiles.length + requestLogs.length,
        totalSizeBytes: dailyTotalSize + requestTotalSize,
        totalSizeMB: ((dailyTotalSize + requestTotalSize) / 1024 / 1024).toFixed(2)
      }
    };
  } catch (error) {
    return {
      error: 'Failed to get log stats: ' + error.message
    };
  }
}

// Endpoint to upload an image to imgbb and return the display_url
app.post('/uploadToImgbb', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No image file uploaded. Use field name "image".' });
    }
    const filename = req.file.originalname || 'uploaded_image.png';
    const fileBuffer = req.file.buffer;
    const displayUrl = await uploadImageToImgbb(fileBuffer, filename);
    if (displayUrl) {
      return res.status(200).json({ ok: true, display_url: displayUrl });
    } else {
      return res.status(500).json({ ok: false, error: 'Failed to upload image to imgbb.' });
    }
  } catch (error) {
    console.error('Error in /uploadToImgbb:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Setup base flows for a client
app.post('/setBaseFlows', async (req, res) => {
  const { clientID, brand } = req.body || {};
  
  if (!clientID) {
    return res.status(400).json({ error: 'clientID is required' });
  }
  
  if (!brand) {
    return res.status(400).json({ error: 'brand is required' });
  }
  
  try {
    await smallFunctions.authorize();
    const result = await setupBaseStructure(clientID, brand);
    console.log(`✅ Base flows setup completed for client: ${clientID} in ${result.executionTime || 'unknown time'}`);
    res.json(result);
  } catch (error) {
    console.log(`❌ Failed to setup base flows for client ${clientID}: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message,
      clientID,
      brand
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Brand Fetch server running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Logs directory: ${logsDir}`);
  console.log(`📂 Request logs directory: ${path.join(logsDir, 'requests')}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST   /brandFetch - Analyze a brand website`);
  console.log(`   GET    /logs - View daily server logs (query: ?date=YYYY-MM-DD&requestId=XXX&limit=1000)`);
  console.log(`   GET    /logs/request/:filename - View specific request logs`);
  console.log(`   DELETE /logs/:date - Delete logs for specific date`);
  console.log(`   GET    /klaviyo-cookies - Get Klaviyo cookies`);
  console.log(`   GET    /klaviyo-instance - Get Klaviyo instance`);
  console.log(`   GET    /health - Health check with log statistics`);
  console.log(`   POST   /uploadToImgbb - Upload an image to imgbb and return the display_url`);
  console.log(`   POST   /setBaseFlows - Setup base Klaviyo flows for a client`);
  console.log(`📝 All console output is logged to:`);
  console.log(`   - Daily files: ${logsDir}/brand-fetch-YYYY-MM-DD.log`);
  console.log(`   - Request files: ${logsDir}/requests/[url]_[timestamp].log`);
}); 