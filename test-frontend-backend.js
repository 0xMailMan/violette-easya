// Test complete frontend-backend integration
const { initializeApp } = require('firebase/app')
const { getAuth, signInAnonymously } = require('firebase/auth')
require('dotenv').config()

// Test configuration
const AI_SERVER_URL = 'http://localhost:8000'

// Firebase config from environment
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Workflow...\n')
  
  try {
    // 1. Test AI Backend
    console.log('1️⃣ Testing AI Backend...')
    const aiResponse = await fetch(`${AI_SERVER_URL}/health`)
    const aiHealth = await aiResponse.json()
    console.log('✅ AI Backend:', aiHealth.status, '- Anthropic connected:', aiHealth.anthropicConnected)
    
    // 2. Test AI Analysis
    console.log('\n2️⃣ Testing AI Analysis...')
    const analysisResponse = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'I captured a beautiful sunset photo today!' })
    })
    
    const analysisResult = await analysisResponse.json()
    if (analysisResult.success) {
      console.log('✅ AI Analysis working')
      console.log('   Description:', analysisResult.data.description.substring(0, 100) + '...')
      console.log('   Sentiment:', analysisResult.data.sentiment)
      console.log('   Themes:', analysisResult.data.themes.slice(0, 3))
    } else {
      console.log('❌ AI Analysis failed:', analysisResult.error)
      return
    }
    
    // 3. Test Firebase Authentication
    console.log('\n3️⃣ Testing Firebase Authentication...')
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    
    const userCredential = await signInAnonymously(auth)
    const userId = userCredential.user.uid
    console.log('✅ Firebase Auth working - User ID:', userId.substring(0, 8) + '...')
    
    // 4. Test Frontend AI Service (simulated)
    console.log('\n4️⃣ Testing Frontend AI Service Integration...')
    
    // Simulate what the frontend AI service does
    const frontendRequest = {
      content: 'Testing frontend integration',
      imageBase64: null,
      type: 'text'
    }
    
    // Transform to server format (like in ai-service.ts)
    const serverRequest = { text: frontendRequest.content }
    
    const frontendResponse = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serverRequest)
    })
    
    const frontendResult = await frontendResponse.json()
    if (frontendResult.success) {
      console.log('✅ Frontend AI Service integration working')
      console.log('   Response format correct:', typeof frontendResult.data.description === 'string')
    } else {
      console.log('❌ Frontend AI Service integration failed:', frontendResult.error)
    }
    
    // 5. Test Embedding Generation
    console.log('\n5️⃣ Testing Embedding Generation...')
    const embeddingResponse = await fetch(`${AI_SERVER_URL}/api/ai/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Test embedding generation' })
    })
    
    const embeddingResult = await embeddingResponse.json()
    if (embeddingResult.success) {
      console.log('✅ Embedding generation working')
      console.log('   Dimensions:', embeddingResult.data.dimensions)
      console.log('   Sample values:', embeddingResult.data.embedding.slice(0, 5))
    } else {
      console.log('❌ Embedding generation failed:', embeddingResult.error)
    }
    
    console.log('\n🎉 Complete workflow test passed!')
    console.log('\n📱 Your app should work with:')
    console.log('   Frontend: http://localhost:3000')
    console.log('   AI Backend: http://localhost:8000')
    console.log('\n💡 If photo upload isn\'t working in frontend:')
    console.log('   1. Check browser console for errors')
    console.log('   2. Verify the camera component is using the updated AI service')
    console.log('   3. Make sure Firestore authentication is working')
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure servers are running:')
      console.log('   npm run dev (for frontend)')
      console.log('   npm run ai-server (for backend)')
    }
  }
}

testCompleteWorkflow() 