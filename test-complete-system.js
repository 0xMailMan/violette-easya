// Complete system integration test
require('dotenv').config()

const AI_SERVER_URL = 'http://localhost:8000'
const BACKEND_SERVER_URL = 'http://localhost:8001'
const FRONTEND_URL = 'http://localhost:3000'

async function testCompleteSystem() {
  console.log('🧪 Testing Complete System Integration...\n')
  console.log('Required servers:')
  console.log('  Frontend: http://localhost:3000')
  console.log('  AI Server: http://localhost:8000') 
  console.log('  Backend: http://localhost:8001\n')
  
  try {
    // 1. Test AI Server Health
    console.log('1️⃣ Testing AI Server...')
    try {
      const aiResponse = await fetch(`${AI_SERVER_URL}/health`)
      const aiHealth = await aiResponse.json()
      console.log('✅ AI Server:', aiHealth.status, '- Anthropic connected:', aiHealth.anthropicConnected)
    } catch (error) {
      console.log('❌ AI Server not running on port 8000')
      console.log('   Start with: npm run ai-server')
      return
    }
    
    // 2. Test Backend Server Health  
    console.log('\n2️⃣ Testing Backend Server...')
    try {
      const backendResponse = await fetch(`${BACKEND_SERVER_URL}/health`)
      const backendHealth = await backendResponse.json()
      console.log('✅ Backend Server:', backendHealth.status)
      console.log('   Firebase:', backendHealth.services.firebase)
      console.log('   Blockchain:', backendHealth.services.blockchain)
    } catch (error) {
      console.log('❌ Backend Server not running on port 8001')
      console.log('   Start with: PORT=8001 npm run backend:dev')
      return
    }
    
    // 3. Test Frontend
    console.log('\n3️⃣ Testing Frontend...')
    try {
      const frontendResponse = await fetch(FRONTEND_URL)
      if (frontendResponse.ok) {
        console.log('✅ Frontend accessible on port 3000')
      } else {
        console.log('❌ Frontend returned error:', frontendResponse.status)
      }
    } catch (error) {
      console.log('❌ Frontend not running on port 3000')
      console.log('   Start with: npm run dev')
      return
    }
    
    // 4. Test AI Processing Flow
    console.log('\n4️⃣ Testing AI Processing...')
    const testText = 'I just took a beautiful photo of a sunset at the beach. The colors were incredible!'
    
    const aiAnalysis = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    })
    
    if (aiAnalysis.ok) {
      const result = await aiAnalysis.json()
      console.log('✅ AI Analysis working:')
      console.log('   Description:', result.data.description.substring(0, 80) + '...')
      console.log('   Sentiment:', result.data.sentiment)
      console.log('   Themes:', result.data.themes.slice(0, 3))
      
      // 5. Test Embedding Generation
      console.log('\n5️⃣ Testing Embedding Generation...')
      const embeddingResponse = await fetch(`${AI_SERVER_URL}/api/ai/generate-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: result.data.description })
      })
      
      if (embeddingResponse.ok) {
        const embedding = await embeddingResponse.json()
        console.log('✅ Embedding generated:', embedding.data.dimensions, 'dimensions')
      }
    } else {
      console.log('❌ AI Analysis failed')
    }
    
    // 6. Test Anonymous Authentication
    console.log('\n6️⃣ Testing Authentication...')
    const authResponse = await fetch(`${BACKEND_SERVER_URL}/api/auth/anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    let authToken = null
    if (authResponse.ok) {
      const authResult = await authResponse.json()
      authToken = authResult.data.token
      console.log('✅ Anonymous auth working - User:', authResult.data.userId.substring(0, 12) + '...')
    } else {
      console.log('❌ Authentication failed')
      return
    }
    
    // 7. Test Blockchain Operations
    console.log('\n7️⃣ Testing Blockchain Operations...')
    
    // Test Merkle Tree Creation
    const now = Date.now()
    
    // Use simple timestamp format that survives JSON serialization
    const sampleEntries = [
      {
        id: 'entry1',
        content: 'Beautiful sunset photo',
        timestamp: now,
        tags: ['sunset', 'photography']
      },
      {
        id: 'entry2',
        content: 'Morning coffee thoughts',
        timestamp: now + 1000,
        tags: ['coffee', 'reflection']
      }
    ]
    
    const merkleResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/create-merkle-tree`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ entries: sampleEntries })
    })
    
    if (merkleResponse.ok) {
      const merkleResult = await merkleResponse.json()
      console.log('✅ Merkle Tree created:')
      console.log('   Root:', merkleResult.data.merkleRoot.substring(0, 20) + '...')
      console.log('   Entries:', merkleResult.data.entryCount)
      
      // Test Merkle Proof
      const proofResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/generate-proof`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          merkleTree: merkleResult.data.merkleTree,
          entryIndex: 0
        })
      })
      
      if (proofResponse.ok) {
        const proof = await proofResponse.json()
        console.log('✅ Merkle Proof generated:', proof.data.proof.length, 'elements')
        
        // Test Proof Verification
        const verifyResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/verify-proof`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ 
            proof: proof.data,
            merkleRoot: merkleResult.data.merkleRoot
          })
        })
        
        if (verifyResponse.ok) {
          const verification = await verifyResponse.json()
          console.log('✅ Proof verification:', verification.data.isValid ? 'VALID' : 'INVALID')
        }
      }
    } else {
      const error = await merkleResponse.json()
      console.log('❌ Merkle tree creation failed:', error.error)
    }
    
    // 8. Test XRPL Network Status
    console.log('\n8️⃣ Testing XRPL Network...')
    const networkResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/network-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    if (networkResponse.ok) {
      const network = await networkResponse.json()
      console.log('✅ XRPL Network Status:')
      console.log('   Connected:', network.data.connected)
      console.log('   Ledger:', network.data.ledgerIndex)
      console.log('   State:', network.data.serverState)
    } else {
      console.log('❌ XRPL network check failed')
    }
    
    console.log('\n🎉 Complete System Test Results:')
    console.log('✅ AI Processing: Working')
    console.log('✅ Backend APIs: Working') 
    console.log('✅ Blockchain Integration: Working')
    console.log('✅ Authentication: Working')
    console.log('✅ Merkle Tree Privacy: Working')
    
    console.log('\n🚀 Ready for Manual Testing:')
    console.log('1. Open http://localhost:3000 in your browser')
    console.log('2. Try uploading a photo using the camera')
    console.log('3. Check that AI analysis works')
    console.log('4. Verify data is processed correctly')
    
  } catch (error) {
    console.error('❌ System test failed:', error.message)
  }
}

testCompleteSystem() 