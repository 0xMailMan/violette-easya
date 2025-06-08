const { Client } = require('xrpl');

async function testDIDResolution() {
  console.log('🔍 Testing DID Resolution Debug...\n');
  
  const client = new Client('wss://s.altnet.rippletest.net:51233');
  
  try {
    console.log('1️⃣ Connecting to XRPL...');
    await client.connect();
    console.log('✅ Connected to XRPL testnet');
    
    const address = 'r9rdiisPGHf1wkpp5gNU2WpXKMTUR5v84s';
    console.log(`\n2️⃣ Querying DID objects for address: ${address}`);
    
    const response = await client.request({
      command: 'account_objects',
      account: address,
      type: 'did'
    });
    
    console.log('✅ Query successful');
    console.log(`Found ${response.result.account_objects.length} DID objects`);
    
    if (response.result.account_objects.length > 0) {
      const didObject = response.result.account_objects[0];
      console.log('\n📄 DID Object Details:');
      console.log('   Type:', didObject.LedgerEntryType);
      console.log('   Account:', didObject.Account);
      console.log('   Has DIDDocument:', !!didObject.DIDDocument);
      console.log('   Has URI:', !!didObject.URI);
      
      if (didObject.DIDDocument) {
        console.log('\n📋 DID Document (hex):', didObject.DIDDocument.substring(0, 50) + '...');
        
        try {
          const docJson = Buffer.from(didObject.DIDDocument, 'hex').toString('utf8');
          const docObj = JSON.parse(docJson);
          console.log('\n📋 Parsed DID Document:');
          console.log(JSON.stringify(docObj, null, 2));
        } catch (err) {
          console.log('❌ Failed to parse DID document:', err.message);
        }
      }
    } else {
      console.log('❌ No DID objects found');
    }
    
    await client.disconnect();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
}

testDIDResolution(); 