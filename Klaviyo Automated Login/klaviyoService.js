import { testSavedInstance } from './axiosInstanceSaver.js';
import fs from 'fs';

//------------------------------------
// Configuration
//------------------------------------
const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SAVED_INSTANCE_FILE = 'saved_axios_instance.json';

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
      
      const testResult = await testSavedInstance();
      
      if (testResult && testResult.valid) {
        this.axiosInstance = testResult.axiosInstance;
        this.cookieJar = testResult.cookieJar;
        this.log(`✅ Instance reloaded successfully - Authenticated as: ${testResult.email}`, 'SUCCESS');
        return true;
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
      
      // Test if saved instance exists and is valid
      const testResult = await testSavedInstance();
      
      if (testResult && testResult.valid) {
        this.axiosInstance = testResult.axiosInstance;
        this.cookieJar = testResult.cookieJar;
        //this.log(`✅ Loaded valid saved instance - Authenticated as: ${testResult.email}`);
        
        // Set up file watching for automatic reloads
        this.setupFileWatcher();
        
        return true;
      } else {
        this.log('❌ No valid saved instance found. Please run Login.js first.');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Initialization failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  setupFileWatcher() {
    try {
      const absolutePath = `${process.cwd()}/${SAVED_INSTANCE_FILE}`;
      
      // Get initial file stats
      if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        this.lastFileModified = stats.mtime.getTime();
      }
      
      // Watch for file changes
      this.fileWatcher = fs.watchFile(absolutePath, { interval: 50000 }, async (curr, prev) => {
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
      fs.unwatchFile(`${process.cwd()}/${SAVED_INSTANCE_FILE}`);
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

async function startService() {
  console.log('🚀 Starting Klaviyo Service with Saved Instance...\n');
  
  const success = await service.start();
  
  if (success) {
    console.log('\n📋 Service is running:');
    console.log('  - Health checks every 10 minutes');
    console.log('  - Press Ctrl+C to stop');
    console.log('  - Import this module to use the client\n');
  } else {
    console.error('❌ Failed to start service');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  service.stop();
  process.exit(0);
});

// Start the service
startService();

// Export for use in other scripts
export default service; 