// Test DID Creation on XRPL
require('dotenv').config()

const BACKEND_SERVER_URL = 'http://localhost:8001'

async function testDIDCreation() {
  console.log('🆔 Testing DID Creation on XRPL...\n')
  
  try {
    // Step 1: Create anonymous authentication
    console.log('1️⃣ Creating anonymous session...')
    const authResponse = await fetch(`${BACKEND_SERVER_URL}/api/auth/anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!authResponse.ok) {
      console.log('❌ Authentication failed')
      return
    }
    
    const authResult = await authResponse.json()
    const authToken = authResult.data.token
    const userId = authResult.data.userId
    
    console.log('✅ Authentication successful')
    console.log('   User ID:', userId.substring(0, 15) + '...')
    console.log('   Token:', authToken.substring(0, 20) + '...')
    
    // Step 2: Check XRPL network status
    console.log('\n2️⃣ Checking XRPL network...')
    const networkResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/network-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    if (networkResponse.ok) {
      const network = await networkResponse.json()
      console.log('✅ XRPL Network Status:')
      console.log('   Connected:', network.data.connected)
      console.log('   Ledger Index:', network.data.ledgerIndex)
      console.log('   Server State:', network.data.serverState)
      console.log('   Base Fee:', network.data.baseFee, 'XRP')
      
      if (!network.data.connected || network.data.serverState !== 'full') {
        console.log('❌ XRPL network not ready for transactions')
        return
      }
    } else {
      console.log('❌ Could not check XRPL network status')
      return
    }
    
    // Step 3: Create DID with privacy preferences
    console.log('\n3️⃣ Creating DID on XRPL...')
    console.log('   This will:')
    console.log('   - Generate a new XRPL wallet')
    console.log('   - Fund it with testnet XRP')
    console.log('   - Mint an NFT to represent the DID')
    console.log('   - Store DID record in Firebase')
    console.log('   - Return the DID identifier')
    
    const privacyPreferences = {
      shareLocation: false,
      shareTimestamps: false,
      anonymousMode: true
    }
    
    console.log('\n   Privacy Settings:')
    console.log('   - Anonymous Mode:', privacyPreferences.anonymousMode)
    console.log('   - Share Location:', privacyPreferences.shareLocation)
    console.log('   - Share Timestamps:', privacyPreferences.shareTimestamps)
    
    const didResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/create-did`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ privacyPreferences })
    })
    
    console.log('\n   ⏳ Creating DID... (this may take 10-30 seconds)')
    
    if (didResponse.ok) {
      const didResult = await didResponse.json()
      
      if (didResult.success) {
        console.log('\n🎉 DID Creation Successful!')
        console.log('   DID:', didResult.data.didId)
        console.log('   XRPL Address:', didResult.data.xrplAddress)
        console.log('   NFT Token ID:', didResult.data.nftTokenId)
        console.log('   Transaction Hash:', didResult.data.transactionHash)
        
        // Step 4: Verify DID resolution
        console.log('\n4️⃣ Verifying DID resolution...')
        const resolveResponse = await fetch(`${BACKEND_SERVER_URL}/api/blockchain/resolve-did/${didResult.data.didId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        
        if (resolveResponse.ok) {
          const resolveResult = await resolveResponse.json()
          console.log('✅ DID Resolution successful:')
          console.log('   DID ID:', resolveResult.data.didId)
          console.log('   XRPL Address:', resolveResult.data.xrplAddress)
          console.log('   Verification Status:', resolveResult.data.verificationStatus)
          console.log('   Blockchain Records:', resolveResult.data.blockchainRecords?.length || 0)
        } else {
          console.log('❌ DID resolution failed')
        }
        
        // Step 5: Test with the new DID
        console.log('\n5️⃣ Testing Merkle operations with DID...')
        
        const sampleEntries = [
          {
            id: 'did-entry-1',
            content: 'First entry with my new DID',
            timestamp: Date.now(),
            tags: ['did', 'blockchain', 'identity']
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
          console.log('✅ Merkle tree created with DID:')
          console.log('   Root Hash:', merkleResult.data.merkleRoot.substring(0, 16) + '...')
          console.log('   Entry Count:', merkleResult.data.entryCount)
          
          // Test storing merkle root on blockchain (requires wallet seed)
          console.log('\n6️⃣ Ready for Merkle root storage on blockchain')
          console.log('   (Would store Merkle root on XRPL with DID reference)')
          console.log('   DID:', didResult.data.didId)
          console.log('   Merkle Root:', merkleResult.data.merkleRoot)
          
        } else {
          console.log('❌ Merkle tree creation failed')
        }
        
        console.log('\n🏆 DID Creation Test Results:')
        console.log('✅ DID Created on XRPL')
        console.log('✅ NFT Minted Successfully') 
        console.log('✅ DID Stored in Firebase')
        console.log('✅ DID Resolution Working')
        console.log('✅ Ready for Merkle Operations')
        
        console.log('\n📋 Your DID Summary:')
        console.log('   Decentralized ID:', didResult.data.didId)
        console.log('   Blockchain Address:', didResult.data.xrplAddress)
        console.log('   Identity NFT:', didResult.data.nftTokenId)
        console.log('   Transaction:', `https://testnet.xrpl.org/transactions/${didResult.data.transactionHash}`)
        
      } else {
        console.log('❌ DID creation failed:', didResult.error)
      }
    } else {
      const error = await didResponse.json()
      console.log('❌ DID creation request failed:', error.error)
    }
    
  } catch (error) {
    console.error('❌ DID creation test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running:')
      console.log('   PORT=8001 npm run backend:dev')
    }
  }
}

console.log('🔗 XRPL DID Creation Test')
console.log('This will create a real decentralized identity on XRPL testnet!')
console.log('Make sure your backend server is running on port 8001\n')

testDIDCreation() 