import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import fs from 'fs';
import { analyzeBrand } from './NEW Brand Fetch Method/brand-analyzer.js';

const templates = JSON.parse(
  await readFile(new URL('./Templates/Functions/Templates.json', import.meta.url))
);

console.log('🚀 Initializing brand fetch server...');

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

// --> ADDING THIS LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log('--- Incoming Request ---');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('------------------------');
  next();
});

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Brand Fetch endpoint
app.post('/brandFetch', async (req, res) => {
  try {
    const { url, shouldGetBestSellers = false, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required parameter: url' 
      });
    }
    
    console.log(`📥 Received brand fetch request for: ${url}`);
    console.log(`📊 Should get best sellers: ${shouldGetBestSellers}`);
    
    const startTime = Date.now();
    const result = await analyzeBrand(url, shouldGetBestSellers, options);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Brand analysis completed in ${duration} seconds`);
    
    res.status(200).json({ 
      ok: true, 
      data: result,
      meta: {
        processingTime: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('❌ Brand fetch error:', err);
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Template generation endpoint
app.post('/make_template', async (req, res) => {
  try {
    const { templateId, templateData } = req.body;
    if (!templateId || !templateData) {
      return res.status(400).json({ ok: false, error: 'Missing templateId or templateData' });
    }
    // Find the template object by ID in all folders
    let selectedTemplate = null;
    for (const group of Object.values(templates)) {
      const found = group.find(t => t.id === templateId);
      if (found) {
        selectedTemplate = found;
        break;
      }
    }
    if (!selectedTemplate) {
      return res.status(404).json({ ok: false, error: 'Template not found for ID: ' + templateId });
    }
    // Dynamically import the template file
    const { generateTemplate } = await import('./' + selectedTemplate.location);
    // Generate the template - properly await the result which might be async
    const result = await Promise.resolve(generateTemplate(templateData));
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('❌ Template generation error:', err);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Brand Fetch server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /brandFetch - Analyze a brand website`);
  console.log(`   POST /make_template - Generate templates`);
  console.log(`   GET  /klaviyo-cookies - Get Klaviyo cookies`);
  console.log(`   GET  /klaviyo-instance - Get Klaviyo instance`);
  console.log(`   GET  /health - Health check`);
}); 