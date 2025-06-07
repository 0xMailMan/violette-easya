const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

async function testAnthropic() {
  try {
    console.log('🧪 Testing Anthropic API connectivity...');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  ANTHROPIC_API_KEY not found in environment variables');
      console.log('📝 Please set your Anthropic API key in the .env file');
      return;
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('🔑 API key found, testing connection...');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with a brief confirmation that the Anthropic API is working correctly.',
        },
      ],
    });

    console.log('✅ Anthropic API test successful!');
    console.log('🤖 Claude response:', (response.content[0]).text);
    
  } catch (error) {
    console.log('❌ Anthropic API test failed:');
    console.error(error.message);
    
    if (error.status === 401) {
      console.log('🔐 Authentication failed - please check your API key');
    } else if (error.status === 429) {
      console.log('⏱️  Rate limit exceeded - please try again later');
    }
  }
}

// Run the test
testAnthropic(); 