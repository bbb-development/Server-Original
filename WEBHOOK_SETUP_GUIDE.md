# 🪝 Simple Slack Webhook Setup (RECOMMENDED)

**⏱️ Setup time: 2 minutes**  
**Perfect for: Sending notifications only**

## 🚀 Step 1: Add Incoming Webhooks to Slack

### 1.1 Go to Slack App Directory
- Open your Slack workspace
- Click your **workspace name** (top left)
- Select **Settings & administration** → **Manage apps**

### 1.2 Add Incoming Webhooks
1. Search for **"Incoming Webhooks"**
2. Click **"Add"** 
3. Click **"Add to Slack"**

### 1.3 Configure Webhook
1. **Choose a channel** (e.g., #general, #notifications)
2. **Customize name**: `Server Scraper Bot`
3. **Customize icon**: Choose an emoji like 🤖
4. Click **"Add Incoming Webhooks integration"**

### 1.4 Copy Webhook URL
You'll see a URL like:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```
**Copy this entire URL** 📋

## ⚙️ Step 2: Configure Environment

### 2.1 Add to .env file
```bash
# Simple Webhook approach (RECOMMENDED)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

# Optional: For full app approach
# SLACK_BOT_TOKEN=xoxb-your-token-here
```

## 🧪 Step 3: Test Your Setup

Run the test:
```bash
node test-slack.js
```

You should see messages appear in your chosen Slack channel! 🎉

## 📝 Step 4: Add to Your Server

### 4.1 Server Startup Notifications
```javascript
import { sendServerStartup } from './utils/slackBot.js';

// In your server.js
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  
  // Notify Slack
  try {
    await sendServerStartup(PORT);
  } catch (error) {
    console.error('Failed to send startup notification:', error.message);
  }
});
```

### 4.2 Scraping Notifications
```javascript
import { sendScrapingNotification } from './utils/slackBot.js';

// After scraping
try {
  // ... your scraping code ...
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Notify success
  await sendScrapingNotification(url, method, true, elapsed + 's');
} catch (error) {
  // Notify failure  
  await sendScrapingNotification(url, method, false, '0s', error.message);
}
```

## 🔄 Webhook vs Full App Comparison

| Feature | Webhook | Full Slack App |
|---------|---------|----------------|
| **Setup time** | 2 minutes | 10+ minutes |
| **Send messages** | ✅ | ✅ |
| **Choose channels** | ❌ (fixed) | ✅ |
| **Read messages** | ❌ | ✅ |
| **Interactive features** | ❌ | ✅ |
| **File uploads** | ❌ | ✅ |
| **Complexity** | Very simple | Complex |

## 🎯 **Recommendation for Your Use Case:**

**Use Webhooks!** They're perfect for:
- ✅ Scraping notifications
- ✅ Error alerts  
- ✅ Server status updates
- ✅ Simple logging

You can always upgrade to a full Slack app later if needed.

## 🚨 Troubleshooting

### Messages not appearing?
1. **Check webhook URL** - Make sure it's complete and correct
2. **Check channel** - Verify the webhook channel exists
3. **Test manually** - Use curl to test:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```

### Want to change the channel?
Create a new webhook for the new channel, or upgrade to a full Slack app.

## ✅ You're Done!

Your webhook is ready to send notifications! Much simpler than a full Slack app. 🚀 