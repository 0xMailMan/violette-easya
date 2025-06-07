// Using built-in fetch (Node.js 18+)

async function testAIAnalysis() {
  try {
    console.log('🧪 Testing AI Analysis endpoint...');
    
    const response = await fetch('http://localhost:8000/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: "I had a wonderful day at the beach today. The sunset was absolutely breathtaking, and I felt so peaceful watching the waves."
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AI Analysis successful!');
      console.log('📝 Description:', result.data.description);
      console.log('🏷️  Themes:', result.data.themes);
      console.log('😊 Sentiment:', result.data.sentiment);
      console.log('🎯 Confidence:', result.data.confidence);
      console.log('🔖 Tags:', result.data.suggestedTags);
    } else {
      console.log('❌ AI Analysis failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function testEmbedding() {
  try {
    console.log('\n🧪 Testing Embedding generation...');
    
    const response = await fetch('http://localhost:8000/api/ai/generate-embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: "A peaceful sunset at the beach with gentle waves"
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Embedding generation successful!');
      console.log('📊 Dimensions:', result.data.dimensions);
      console.log('🔢 First 10 values:', result.data.embedding.slice(0, 10));
    } else {
      console.log('❌ Embedding generation failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run tests
testAIAnalysis().then(() => testEmbedding()); 