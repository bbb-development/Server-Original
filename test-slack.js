import { 
  testSlackBot, 
  sendSlackMessage, 
  sendScrapingNotification,
  sendRichMessage
} from './utils/slackBot.js';

async function runSlackTests() {
  console.log('🧪 Starting Slack Bot Tests...\n');

  try {
    // Test 1: Basic bot connection
    console.log('1. Testing basic bot connection...');
    await testSlackBot('#general');
    console.log('✅ Basic connection test passed\n');

    // Test 2: Simple message
    console.log('2. Testing simple message...');
    await sendSlackMessage('#general', 'Hello from Server Scraper Bot! 🤖');
    console.log('✅ Simple message test passed\n');

    // Test 4: Scraping failure notification
    console.log('4. Testing scraping failure notification...');
    await sendScrapingNotification(
      '#general', 
      'https://example.com', 
      'extractBestSellers', 
      false, 
      '1.2s', 
      'Navigation timeout after 30 seconds'
    );
    console.log('✅ Scraping failure notification passed\n');

    // Test 5: Rich message with data
    console.log('5. Testing rich message...');
    const sampleData = {
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      backgroundColor: '#FF6B6B',
      textColor: '#FFFFFF',
      imagesFound: 15,
      duration: '4.2s'
    };
    await sendRichMessage('#general', '🎨 Brand Brief Test Results', sampleData, 'good');
    console.log('✅ Rich message test passed\n');

    console.log('🎉 All Slack bot tests completed successfully!');
    console.log('Check your Slack channels to see the messages.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('SLACK_BOT_TOKEN')) {
      console.log('\n📝 Make sure to:');
      console.log('1. Set SLACK_BOT_TOKEN in your .env file');
      console.log('2. Follow the setup guide in SLACK_SETUP_GUIDE.md');
    }
    
    if (error.message.includes('channel_not_found')) {
      console.log('\n📝 Channel issue:');
      console.log('1. Make sure the channel exists');
      console.log('2. Invite your bot to the channel');
      console.log('3. Or use a different channel like #general');
    }
  }
}

// Run the tests
runSlackTests(); 