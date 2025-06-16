import { executeKlaviyoLogin } from './Login.js';

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
    console.log(`\n--- Scheduled refresh (every ${INTERVAL_HOURS} hours) ---`);
    executeKlaviyoLogin();
  }, INTERVAL_MS);
  
  const nextExecution = new Date(Date.now() + INTERVAL_MS);
  console.log(`\x1b[33mNext refresh scheduled for ${nextExecution.toLocaleString()}\x1b[0m`);
}

startRecurringExecution();