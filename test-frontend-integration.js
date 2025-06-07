#!/usr/bin/env node

/**
 * Test script to verify frontend-backend integration
 * This simulates the frontend calling the AI backend
 */

const AI_SERVER_URL = 'http://localhost:8000'

async function testAIServerHealth() {
  console.log('🔍 Testing AI server health...')
  try {
    const response = await fetch(`${AI_SERVER_URL}/health`)
    if (response.ok) {
      console.log('✅ AI server is healthy')
      return true
    } else {
      console.log('❌ AI server health check failed:', response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ AI server is not running:', error.message)
    return false
  }
}

async function testPhotoAnalysis() {
  console.log('\n📸 Testing photo analysis simulation...')
  
  // Simulate a base64 image (just a small sample)
  const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  
  const request = {
    text: 'A beautiful sunset at the beach',
    photo: sampleImageBase64
  }

  try {
    const response = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Photo analysis successful!')
      console.log('📝 Description:', result.data.description.substring(0, 100) + '...')
      console.log('😊 Sentiment:', result.data.sentiment)
      console.log('🏷️  Tags:', result.data.suggestedTags.slice(0, 3).join(', '))
      console.log('🎯 Themes:', result.data.themes.slice(0, 2).join(', '))
      
      // Test merkle root generation
      const merkleData = [
        result.data.description,
        result.data.themes.join(','),
        result.data.suggestedTags.join(','),
        result.data.sentiment.toString(),
        sampleImageBase64.substring(0, 100)
      ]
      
      const merkleRoot = generateMerkleRoot(merkleData)
      console.log('🌳 Merkle root:', merkleRoot)
      
      return true
    } else {
      console.log('❌ Photo analysis failed:', response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Photo analysis error:', error.message)
    return false
  }
}

async function testTextAnalysis() {
  console.log('\n📝 Testing text analysis...')
  
  const request = {
    text: 'I had an amazing day at the park with my friends. We played frisbee and had a picnic.'
  }

  try {
    const response = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Text analysis successful!')
      console.log('📝 Description:', result.data.description.substring(0, 100) + '...')
      console.log('😊 Sentiment:', result.data.sentiment)
      console.log('🏷️  Tags:', result.data.suggestedTags.slice(0, 3).join(', '))
      console.log('🎯 Themes:', result.data.themes.slice(0, 2).join(', '))
      
      return true
    } else {
      console.log('❌ Text analysis failed:', response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Text analysis error:', error.message)
    return false
  }
}

// Simple merkle root generation (same as in frontend)
function generateMerkleRoot(data) {
  if (data.length === 0) return ''
  if (data.length === 1) return hashString(data[0])
  
  const hashes = data.map(hashString)
  return buildMerkleTree(hashes)
}

function hashString(input) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function buildMerkleTree(hashes) {
  if (hashes.length === 1) return hashes[0]
  
  const nextLevel = []
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]
    const right = hashes[i + 1] || left
    nextLevel.push(hashString(left + right))
  }
  
  return buildMerkleTree(nextLevel)
}

async function runTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n')
  
  const healthOk = await testAIServerHealth()
  if (!healthOk) {
    console.log('\n❌ Tests failed: AI server is not running')
    console.log('💡 Start the AI server with: npm run ai-server')
    process.exit(1)
  }
  
  const photoOk = await testPhotoAnalysis()
  const textOk = await testTextAnalysis()
  
  console.log('\n📊 Test Results:')
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`)
  console.log(`Photo Analysis: ${photoOk ? '✅' : '❌'}`)
  console.log(`Text Analysis: ${textOk ? '✅' : '❌'}`)
  
  if (healthOk && photoOk && textOk) {
    console.log('\n🎉 All tests passed! Frontend integration is ready.')
    console.log('💡 You can now start the frontend with: npm run dev')
  } else {
    console.log('\n❌ Some tests failed. Check the AI server.')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
} 