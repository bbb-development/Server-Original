import 'dotenv/config';

/**
 * Slack Bot Utility
 * Sends messages to Slack channels using the Slack Web API
 */

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_API_URL = 'https://slack.com/api';

/**
 * Send a message to a Slack channel
 * @param {string} channel - Channel ID or name (e.g., '#general' or 'C1234567890')
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 * @param {string} options.username - Bot username (optional)
 * @param {string} options.icon_emoji - Bot emoji icon (optional)
 * @param {Array} options.blocks - Slack blocks for rich formatting (optional)
 * @param {Array} options.attachments - Message attachments (optional)
 * @returns {Promise<Object>} Slack API response
 */
export async function sendSlackMessage(channel, text, options = {}) {
  if (!SLACK_BOT_TOKEN) {
    throw new Error('SLACK_BOT_TOKEN environment variable is not set');
  }

  if (!channel) {
    throw new Error('Channel parameter is required');
  }

  if (!text && !options.blocks) {
    throw new Error('Either text or blocks must be provided');
  }

  const payload = {
    channel: channel,
    text: text,
    ...options
  };

  try {
    console.log(`📤 Sending message to Slack channel: ${channel}`);
    
    const response = await fetch(`${SLACK_API_URL}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error} - ${data.warning || ''}`);
    }

    console.log('✅ Message sent successfully to Slack');
    return data;

  } catch (error) {
    console.error('❌ Failed to send Slack message:', error.message);
    throw error;
  }
}

/**
 * Send a formatted scraping notification to Slack
 * @param {string} channel - Slack channel
 * @param {string} url - Website URL that was scraped
 * @param {string} method - Scraping method used
 * @param {boolean} success - Whether scraping was successful
 * @param {string} duration - How long scraping took
 * @param {string} error - Error message if failed (optional)
 */
export async function sendScrapingNotification(channel, url, method, success, duration, error = null) {
  const status = success ? '✅ Success' : '❌ Failed';
  const emoji = success ? ':white_check_mark:' : ':x:';
  
  let text = `${emoji} *Scraping ${status}*\n`;
  text += `• *URL:* ${url}\n`;
  text += `• *Method:* ${method}\n`;
  text += `• *Duration:* ${duration}\n`;
  
  if (error) {
    text += `• *Error:* ${error}`;
  }

  const blocks = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": text
      }
    }
  ];

  if (!success && error) {
    blocks.push({
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `:warning: *Error Details:* ${error}`
        }
      ]
    });
  }

  return await sendSlackMessage(channel, text, { blocks });
}

/**
 * Send a rich formatted message with attachments
 * @param {string} channel - Slack channel
 * @param {string} title - Message title
 * @param {Object} data - Data to format and send
 * @param {string} color - Attachment color (good, warning, danger, or hex)
 */
export async function sendRichMessage(channel, title, data, color = 'good') {
  const fields = Object.entries(data).map(([key, value]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
    short: typeof value !== 'object' && String(value).length < 30
  }));

  const attachments = [
    {
      color: color,
      title: title,
      fields: fields,
      footer: 'Server Scraper Bot',
      ts: Math.floor(Date.now() / 1000)
    }
  ];

  return await sendSlackMessage(channel, title, { attachments });
}

/**
 * Test the Slack bot connection
 * @param {string} channel - Test channel
 */
export async function testSlackBot(channel = '#general') {
  try {
    const testMessage = `🤖 Slack Bot Test - ${new Date().toISOString()}`;
    const result = await sendSlackMessage(channel, testMessage);
    console.log('✅ Slack bot test successful');
    return result;
  } catch (error) {
    console.error('❌ Slack bot test failed:', error.message);
    throw error;
  }
}
// ============================================================================
// EXAMPLE USAGE AND INTEGRATION FUNCTIONS
// ============================================================================



/**
 * Example: Send error notification
 */
export async function notifyError(error, context = '') {
  const channel = process.env.SLACK_ERROR_CHANNEL || '#errors';
  
  const message = `🚨 *Server Error Alert*
• *Context:* ${context}
• *Error:* ${error.message}
• *Time:* ${new Date().toISOString()}
• *Stack:* \`\`\`${error.stack?.slice(0, 500)}...\`\`\``;

  return await sendSlackMessage(channel, message, {
    username: 'Error Bot',
    icon_emoji: ':warning:'
  });
}

