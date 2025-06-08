#!/usr/bin/env node

// Test Runner for Violette XRPL + Cross-Chain System
// Allows running different test scenarios

const { spawn } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 Violette XRPL + Cross-Chain Test Runner')
console.log('='*50)
console.log('')
console.log('Available test scenarios:')
console.log('1. 📸 Original Workflow (Photo → AI → Firestore → W3C DID → NFT)')
console.log('2. 🔗 Cross-Chain Only (NFT Verification → Mirror Minting → Tethering)')
console.log('3. 🌐 Complete Enhanced Workflow (Original + Cross-Chain)')
console.log('4. 🔧 Quick Cross-Chain Test (Fast simulation)')
console.log('')

rl.question('Select test scenario (1-4): ', (answer) => {
  const choice = parseInt(answer.trim())
  
  switch (choice) {
    case 1:
      console.log('\n🚀 Running Original W3C DID Workflow Test...')
      runOriginalWorkflow()
      break
      
    case 2:
      console.log('\n🚀 Running Cross-Chain Only Test...')
      runCrossChainOnly()
      break
      
    case 3:
      console.log('\n🚀 Running Complete Enhanced Workflow Test...')
      runEnhancedWorkflow()
      break
      
    case 4:
      console.log('\n🚀 Running Quick Cross-Chain Test...')
      runQuickCrossChain()
      break
      
    default:
      console.log('❌ Invalid choice. Please select 1-4.')
      process.exit(1)
  }
  
  rl.close()
})

function runOriginalWorkflow() {
  console.log('This would run the original workflow only (not yet implemented)')
  console.log('For now, use: node test-full-workflow.js')
  console.log('')
  console.log('💡 The enhanced workflow includes all original steps plus cross-chain features')
  process.exit(0)
}

function runCrossChainOnly() {
  console.log('Running cross-chain verification test...')
  const child = spawn('node', ['test-cross-chain.js'], { stdio: 'inherit' })
  
  child.on('close', (code) => {
    console.log(`\n🏁 Cross-chain test completed with exit code ${code}`)
    process.exit(code)
  })
  
  child.on('error', (error) => {
    console.error('❌ Failed to start cross-chain test:', error.message)
    process.exit(1)
  })
}

function runEnhancedWorkflow() {
  console.log('Running complete enhanced workflow test...')
  const child = spawn('node', ['test-full-workflow.js'], { stdio: 'inherit' })
  
  child.on('close', (code) => {
    console.log(`\n🏁 Enhanced workflow test completed with exit code ${code}`)
    process.exit(code)
  })
  
  child.on('error', (error) => {
    console.error('❌ Failed to start enhanced workflow test:', error.message)
    process.exit(1)
  })
}

function runQuickCrossChain() {
  console.log('🏃‍♂️ Quick Cross-Chain Test (Simulation Mode)')
  console.log('=' * 40)
  
  // Quick simulation without server dependencies
  setTimeout(() => {
    console.log('✅ Cross-chain wallet initialized')
    console.log('✅ NFT ownership verified on Unichain')
    console.log('✅ Mirror NFTs minted on XRPL EVM')
    console.log('✅ DID tethering completed')
    console.log('✅ Access verification successful')
    console.log('')
    console.log('🎉 Quick test completed! Run scenario 3 for full integration test.')
    process.exit(0)
  }, 2000)
} 