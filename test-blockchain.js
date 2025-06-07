// Test blockchain integration
require('dotenv').config()

const AI_SERVER_URL = 'http://localhost:8000'

async function testBlockchainIntegration() {
  console.log('🔗 Testing Blockchain Integration...\n')
  
  try {
    // 1. Test Backend Health with Blockchain
    console.log('1️⃣ Testing Backend Health with Blockchain...')
    const healthResponse = await fetch(`${AI_SERVER_URL}/health`)
    const health = await healthResponse.json()
    
    console.log('✅ Backend Health:', health.status)
    console.log('   Firebase:', health.services.firebase)
    console.log('   Blockchain:', health.services.blockchain)
    
    if (health.services.blockchain !== 'up') {
      console.log('❌ Blockchain service is not running. Make sure XRPL testnet is accessible.')
      return
    }
    
    // 2. Test XRPL Network Status
    console.log('\n2️⃣ Testing XRPL Network Status...')
    const networkResponse = await fetch(`${AI_SERVER_URL}/api/blockchain/network-status`, {
      headers: { 'Authorization': 'Bearer test-token' }
    })
    
    if (networkResponse.status === 200) {
      const networkStatus = await networkResponse.json()
      console.log('✅ XRPL Network Status:')
      console.log('   Connected:', networkStatus.data.connected)
      console.log('   Ledger Index:', networkStatus.data.ledgerIndex)
      console.log('   Server State:', networkStatus.data.serverState)
    } else {
      console.log('❌ Network status check failed')
    }
    
    // 3. Test Merkle Tree Creation
    console.log('\n3️⃣ Testing Merkle Tree Creation...')
    const sampleEntries = [
      {
        id: 'entry1',
        content: 'First diary entry',
        timestamp: { toMillis: () => Date.now() },
        tags: ['test', 'sample']
      },
      {
        id: 'entry2', 
        content: 'Second diary entry',
        timestamp: { toMillis: () => Date.now() },
        tags: ['test', 'sample']
      }
    ]
    
    const merkleResponse = await fetch(`${AI_SERVER_URL}/api/blockchain/create-merkle-tree`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ entries: sampleEntries })
    })
    
    if (merkleResponse.status === 200) {
      const merkleResult = await merkleResponse.json()
      console.log('✅ Merkle Tree Created:')
      console.log('   Root Hash:', merkleResult.data.merkleRoot.substring(0, 20) + '...')
      console.log('   Entry Count:', merkleResult.data.entryCount)
      console.log('   Tree Depth:', merkleResult.data.merkleTree.depth)
    } else {
      console.log('❌ Merkle tree creation failed')
    }
    
    // 4. Test Merkle Proof Generation
    console.log('\n4️⃣ Testing Merkle Proof Generation...')
    if (merkleResponse.status === 200) {
      const merkleResult = await merkleResponse.json()
      
      const proofResponse = await fetch(`${AI_SERVER_URL}/api/blockchain/generate-proof`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ 
          merkleTree: merkleResult.data.merkleTree,
          entryIndex: 0
        })
      })
      
      if (proofResponse.status === 200) {
        const proofResult = await proofResponse.json()
        console.log('✅ Merkle Proof Generated:')
        console.log('   Leaf:', proofResult.data.leaf.substring(0, 20) + '...')
        console.log('   Proof Elements:', proofResult.data.proof.length)
      } else {
        console.log('❌ Merkle proof generation failed')
      }
    }
    
    console.log('\n🎉 Blockchain integration test completed!')
    console.log('\n📝 Note: DID creation requires proper authentication.')
    console.log('   Run this with proper auth tokens to test DID functionality.')
    
  } catch (error) {
    console.error('❌ Blockchain test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running:')
      console.log('   npm run backend:dev')
    }
  }
}

testBlockchainIntegration() 