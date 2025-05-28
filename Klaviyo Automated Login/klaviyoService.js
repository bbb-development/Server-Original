import { testSavedInstance } from './axiosInstanceSaver.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAxiosInstance } from './axiosInstanceSaver.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//------------------------------------
// Configuration
//------------------------------------
const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SAVED_INSTANCE_FILE = 'saved_axios_instance.json';
const SAVED_INSTANCE_PATH = path.join(__dirname, SAVED_INSTANCE_FILE);

//------------------------------------
// Klaviyo Service with Saved Instance
//------------------------------------
class KlaviyoService {
  constructor() {
    this.axiosInstance = null;
    this.cookieJar = null;
    this.isRunning = false;
    this.healthCheckInterval = null;
    this.lastHealthCheck = null;
    this.status = 'STOPPED';
    this.startTime = null;
    this.fileWatcher = null;
    this.lastFileModified = null;
  }

  log(message, type = 'INFO') {
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

  async reloadInstance() {
    try {
      this.log('🔄 Reloading axios instance from updated file...', 'INFO');
      
      const loaded = await loadAxiosInstance(SAVED_INSTANCE_PATH);
      
      if (loaded) {
        this.axiosInstance = loaded.axiosInstance;
        this.cookieJar = loaded.cookieJar;
        
        // Test the reloaded instance
        try {
          const response = await this.axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
          
          if (response.status === 200 && response.data && typeof response.data === 'object' && response.data.success === true) {
            this.log(`✅ Instance reloaded successfully - Authenticated as: ${response.data.data.email}`, 'SUCCESS');
            return true;
          } else {
            this.log('❌ Reloaded instance is invalid - authentication failed', 'ERROR');
            return false;
          }
        } catch (authError) {
          this.log(`❌ Reloaded instance authentication test failed: ${authError.message}`, 'ERROR');
          return false;
        }
      } else {
        this.log('❌ Failed to reload instance - file may be invalid', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error reloading instance: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async initialize() {
    try {
      this.log('🚀 Initializing Klaviyo Service with saved instance...');
      
      // Load the saved instance directly
      const loaded = await loadAxiosInstance(SAVED_INSTANCE_PATH);
      
      if (loaded) {
        this.axiosInstance = loaded.axiosInstance;
        this.cookieJar = loaded.cookieJar;
        this.log(`✅ Loaded saved instance from ${loaded.savedAt}`);
        
        // Test the loaded instance by trying to authenticate
        try {
          const response = await this.axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
          
          if (response.status === 200 && response.data && typeof response.data === 'object' && response.data.success === true) {
            this.log(`✅ Instance is valid - Authenticated as: ${response.data.data.email}`, 'SUCCESS');
            
            // Set up file watching for automatic reloads
            this.setupFileWatcher();
            
            return true;
          } else {
            this.log('❌ Saved instance is invalid - authentication failed', 'ERROR');
            this.log('📊 Auth response:', JSON.stringify(response.data, null, 2));
            return false;
          }
        } catch (authError) {
          this.log(`❌ Authentication test failed: ${authError.message}`, 'ERROR');
          return false;
        }
        
      } else {
        this.log('❌ Failed to load saved instance. Please run Login.js first.');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Initialization failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  setupFileWatcher() {
    try {
      // Get initial file stats
      if (fs.existsSync(SAVED_INSTANCE_PATH)) {
        const stats = fs.statSync(SAVED_INSTANCE_PATH);
        this.lastFileModified = stats.mtime.getTime();
      }
      
      // Watch for file changes
      this.fileWatcher = fs.watchFile(SAVED_INSTANCE_PATH, { interval: 50000 }, async (curr, prev) => {
        if (curr.mtime.getTime() !== this.lastFileModified) {
          this.log('📄 Detected saved instance file change - reloading...', 'INFO');
          this.lastFileModified = curr.mtime.getTime();
          
          // Small delay to ensure file write is complete
          setTimeout(async () => {
            await this.reloadInstance();
          }, 2000);
        }
      });
      
      this.log('👁️ File watcher started - will auto-reload on changes', 'INFO');
    } catch (error) {
      this.log(`⚠️ Failed to setup file watcher: ${error.message}`, 'WARN');
    }
  }

  async performHealthCheck() {
    try {
      this.log('🔍 Performing health check...');
      
      if (!this.axiosInstance) {
        throw new Error('No axios instance available');
      }

      const response = await this.axiosInstance.get('https://www.klaviyo.com/ajax/authorization');
      
      if (response.status === 200 && response.data && typeof response.data === 'object' && response.data.success === true) {
        this.lastHealthCheck = new Date();
        this.status = 'HEALTHY';
        this.log(`✅ Health check passed - Authenticated as: ${response.data.data.email}`, 'SUCCESS');
        return true;
      } else {
        throw new Error('Got invalid response from auth endpoint');
      }
      
    } catch (error) {
      this.status = 'UNHEALTHY';
      this.log(`❌ Health check failed: ${error.message}`, 'ERROR');
      this.log('💡 You may need to run Login.js to get a fresh instance', 'WARN');
      return false;
    }
  }

  async start() {
    if (this.isRunning) {
      this.log('⚠️ Service is already running', 'WARN');
      return false;
    }

    // Initialize first
    const initSuccess = await this.initialize();
    if (!initSuccess) {
      return false;
    }

    this.isRunning = true;
    this.status = 'RUNNING';
    this.startTime = new Date();

    // Start health check interval
    this.healthCheckInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthCheck();
      }
    }, HEALTH_CHECK_INTERVAL);

    // Perform initial health check
    await this.performHealthCheck();

    this.log(`✅ Klaviyo Service started! Health checks every ${HEALTH_CHECK_INTERVAL / 60000} minutes`, 'SUCCESS');
    return true;
  }

  stop() {
    if (!this.isRunning) {
      this.log('⚠️ Service is not running', 'WARN');
      return false;
    }

    this.isRunning = false;
    this.status = 'STOPPED';
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clean up file watcher
    if (this.fileWatcher) {
      fs.unwatchFile(SAVED_INSTANCE_PATH);
      this.fileWatcher = null;
      this.log('👁️ File watcher stopped', 'INFO');
    }

    this.log('✅ Klaviyo Service stopped', 'SUCCESS');
    return true;
  }

  getStatus() {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const uptimeFormatted = this.formatUptime(uptime);
    
    return {
      status: this.status,
      isRunning: this.isRunning,
      uptime: uptimeFormatted,
      lastHealthCheck: this.lastHealthCheck,
      startTime: this.startTime
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Get the authenticated client for making requests
  getClient() {
    if (!this.isRunning || this.status !== 'HEALTHY') {
      throw new Error(`Service not ready. Status: ${this.status}`);
    }
    return this.axiosInstance;
  }

  // Convenience methods for making requests
  async get(url, config = {}) {
    const client = this.getClient();
    return client.get(url, config);
  }

  async post(url, data, config = {}) {
    const client = this.getClient();
    return client.post(url, data, config);
  }

  async put(url, data, config = {}) {
    const client = this.getClient();
    return client.put(url, data, config);
  }

  async delete(url, config = {}) {
    const client = this.getClient();
    return client.delete(url, config);
  }
}

//------------------------------------
// Create service and start it
//------------------------------------
const service = new KlaviyoService();

// Promise to track initialization
let initPromise = null;

// Lazy initialization - start service when first accessed
async function ensureStarted() {
  if (!initPromise) {
    initPromise = service.start();
  }
  return await initPromise;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  service.stop();
  process.exit(0);
});

// Wrap service methods to ensure initialization
const serviceProxy = new Proxy(service, {
  get(target, prop) {
    // For async methods that need the service to be started
    if (['get', 'post', 'put', 'delete', 'getClient', 'performHealthCheck'].includes(prop)) {
      return async function(...args) {
        await ensureStarted();
        return target[prop](...args);
      };
    }
    
    // For getStatus, return info even if not started
    if (prop === 'getStatus') {
      return function() {
        if (!target.isRunning && !initPromise) {
          return {
            status: 'NOT_STARTED',
            isRunning: false,
            uptime: '0s',
            lastHealthCheck: null,
            startTime: null
          };
        }
        return target[prop]();
      };
    }
    
    // For other properties/methods, return as-is
    return target[prop];
  }
});

// Export the proxied service
export default serviceProxy; 