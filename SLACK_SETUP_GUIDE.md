# 🤖 Slack Bot Setup Guide

Complete guide to set up Slack integration for your server scraper notifications.

## 📋 Prerequisites

- Slack workspace (admin access recommended)
- Access to create Slack apps
- Node.js server running

## 🚀 Step 1: Create a Slack App

### 1.1 Go to Slack API
Visit: https://api.slack.com/apps

### 1.2 Create New App
1. Click **"Create New App"**
2. Choose **"From scratch"**
3. Enter app details:
   - **App Name**: `Server Scraper Bot`
   - **Workspace**: Select your workspace
4. Click **"Create App"**

## 🔑 Step 2: Configure Bot Permissions

### 2.1 Add Bot Scopes
1. In your app dashboard, go to **"OAuth & Permissions"**
2. Scroll down to **"Scopes"**
3. Under **"Bot Token Scopes"**, add these permissions:
   ```
   chat:write          # Send messages
   chat:write.public   # Send messages to channels bot isn't in
   channels:read       # View public channels
   groups:read         # View private channels
   im:read            # View direct messages
   mpim:read          # View group direct messages
   ```

### 2.2 Optional Enhanced Permissions
For more features, add:
```
files:write         # Upload files
users:read          # Read user information
channels:history    # Read channel history
```

## 📦 Step 3: Install App to Workspace

### 3.1 Install App
1. In **"OAuth & Permissions"**, click **"Install to Workspace"**
2. Review permissions and click **"Allow"**

### 3.2 Get Bot Token
1. After installation, copy the **"Bot User OAuth Token"**
2. It starts with `xoxb-`
3. Keep this secure! 🔐

## ⚙️ Step 4: Environment Configuration

### 4.1 Add to .env file
```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_NOTIFICATIONS_CHANNEL=#general
SLACK_ERROR_CHANNEL=#errors
```

### 4.2 Create Slack Channels (Optional)
Create dedicated channels for different notifications:
- `#scraper-notifications` - For scraping results
- `#scraper-errors` - For error alerts
- `#scraper-logs` - For general logs

## 🧪 Step 5: Test Your Bot

### 5.1 Test Script
Create a test file `test-slack.js`:

```javascript
import { testSlackBot, sendSlackMessage } from './utils/slackBot.js';

async function testBot() {
  try {
    // Test basic message
    await testSlackBot('#general');
    
    // Test custom message
    await sendSlackMessage('#general', 'Hello from Server Scraper Bot! 🤖');
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBot();
```

### 5.2 Run Test
```bash
node test-slack.js
```

## 🔧 Step 6: Integration Examples

### 6.1 Add to Server Startup
```javascript
import { notifyServerStartup } from './utils/slackBot.js';

// In your server.js
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  
  // Notify Slack
  try {
    await notifyServerStartup(PORT);
  } catch (error) {
    console.error('Failed to send startup notification:', error.message);
  }
});
```

### 6.2 Add to Scraping Results
```javascript
import { sendScrapingNotification } from './utils/slackBot.js';

// In your scraping handler
try {
  // ... scraping logic ...
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Notify success
  await sendScrapingNotification(
    '#scraper-notifications', 
    url, 
    method, 
    true, 
    elapsed + 's'
  );
} catch (error) {
  // Notify failure
  await sendScrapingNotification(
    '#scraper-errors', 
    url, 
    method, 
    false, 
    '0s', 
    error.message
  );
}
```

## 🛠️ Advanced Configuration

### Channel ID vs Channel Name
- **Channel names**: `#general`, `#random`
- **Channel IDs**: `C1234567890` (more reliable)
- **Direct messages**: User ID like `U1234567890`

To find Channel ID:
1. Right-click channel in Slack
2. Select "Copy link"
3. Extract ID from URL: `https://workspace.slack.com/archives/C1234567890`

### Bot Customization
```javascript
await sendSlackMessage('#general', 'Custom message', {
  username: 'Scraper Bot',
  icon_emoji: ':robot_face:',
  // or icon_url: 'https://example.com/bot-avatar.png'
});
```

## 🚨 Troubleshooting

### Common Issues

#### 1. `channel_not_found` error
- **Cause**: Bot not in channel or channel doesn't exist
- **Solution**: Invite bot to channel or use correct channel name/ID

#### 2. `not_authed` error  
- **Cause**: Invalid or missing bot token
- **Solution**: Check `SLACK_BOT_TOKEN` in `.env`

#### 3. `missing_scope` error
- **Cause**: Bot lacks required permissions
- **Solution**: Add missing scopes in OAuth & Permissions

#### 4. Messages not appearing
- **Cause**: Bot not installed or permissions revoked
- **Solution**: Reinstall app to workspace

### Debug Mode
Enable detailed logging:
```javascript
// Add to your .env
DEBUG_SLACK=true
```

## 📚 Additional Resources

- [Slack API Documentation](https://api.slack.com/)
- [Block Kit Builder](https://app.slack.com/block-kit-builder) - For rich messages
- [Slack App Management](https://api.slack.com/apps) - Manage your apps

## 🎉 You're All Set!

Your Slack bot is now ready to send notifications about:
- ✅ Successful scraping operations  
- ❌ Failed scraping attempts
- 🚀 Server startup/shutdown
- 🚨 Error alerts
- 📊 Custom data reports

Happy scraping! 🤖 