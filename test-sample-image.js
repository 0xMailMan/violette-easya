#!/usr/bin/env node

/**
 * Test script to analyze the sample image using our AI backend
 */

const fs = require('fs');
const path = require('path');

const AI_SERVER_URL = 'http://localhost:8000'

async function testSampleImageAnalysis() {
  console.log('🖼️  Testing Sample Image Analysis...\n')
  
  try {
    // Read the sample image file
    const imagePath = path.join(__dirname, 'public', 'sample-image.jpg')
    console.log('📁 Reading image from:', imagePath)
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Sample image not found at:', imagePath)
      return false
    }
    
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath)
    const imageBase64 = imageBuffer.toString('base64')
    console.log('📏 Image size:', Math.round(imageBuffer.length / 1024), 'KB')
    console.log('🔢 Base64 length:', imageBase64.length, 'characters')
    
    // Prepare request for AI analysis
    const request = {
      text: 'What do you see in this image? Describe it in detail.',
      photo: imageBase64
    }
    
    console.log('\n🤖 Sending to AI for analysis...')
    
    const response = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ AI Analysis failed:', response.status, response.statusText)
      console.log('Error details:', errorText)
      return false
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ AI Analysis successful!\n')
      
      console.log('📝 DESCRIPTION:')
      console.log('=' .repeat(50))
      console.log(result.data.description)
      console.log('')
      
      console.log('😊 SENTIMENT:', result.data.sentiment)
      const sentimentText = result.data.sentiment > 0.6 ? 'Positive' : 
                           result.data.sentiment > 0.3 ? 'Neutral' : 'Negative'
      console.log(`   (${sentimentText})`)
      console.log('')
      
      console.log('🎯 THEMES:')
      result.data.themes.forEach((theme, index) => {
        console.log(`   ${index + 1}. ${theme}`)
      })
      console.log('')
      
      console.log('🏷️  SUGGESTED TAGS:')
      console.log('   ', result.data.suggestedTags.join(', '))
      console.log('')
      
      console.log('🎲 CONFIDENCE:', Math.round(result.data.confidence * 100) + '%')
      console.log('')
      
      // Test if it detects food
      const description = result.data.description.toLowerCase()
      const themes = result.data.themes.join(' ').toLowerCase()
      const tags = result.data.suggestedTags.join(' ').toLowerCase()
      const allText = `${description} ${themes} ${tags}`
      
      const foodKeywords = ['food', 'meal', 'dish', 'eat', 'dining', 'cuisine', 'cooking', 'recipe', 'ingredient', 'delicious', 'tasty', 'restaurant', 'kitchen', 'plate', 'bowl']
      const detectedFood = foodKeywords.some(keyword => allText.includes(keyword))
      
      console.log('🍽️  FOOD DETECTION:')
      if (detectedFood) {
        console.log('   ✅ Successfully detected food-related content!')
        const foundKeywords = foodKeywords.filter(keyword => allText.includes(keyword))
        console.log('   📋 Food keywords found:', foundKeywords.join(', '))
      } else {
        console.log('   ❌ No food-related content detected')
        console.log('   🔍 You may want to check if the image actually contains food')
      }
      
      return true
    } else {
      console.log('❌ AI Analysis failed:', result.error || 'Unknown error')
      return false
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
    return false
  }
}

async function testEmbeddingGeneration(description) {
  console.log('\n🧠 Testing Embedding Generation...')
  
  try {
    const response = await fetch(`${AI_SERVER_URL}/api/ai/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description })
    })
    
    if (!response.ok) {
      console.log('❌ Embedding generation failed:', response.statusText)
      return false
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ Embedding generated successfully!')
      console.log('📐 Dimensions:', result.data.dimensions)
      console.log('🔢 Sample values:', result.data.embedding.slice(0, 5).map(v => v.toFixed(3)).join(', '), '...')
      return result.data.embedding
    } else {
      console.log('❌ Embedding generation failed:', result.error)
      return false
    }
  } catch (error) {
    console.log('❌ Embedding generation error:', error.message)
    return false
  }
}

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

async function runSampleImageTest() {
  console.log('🚀 Sample Image Analysis Test\n')
  console.log('This test will analyze the sample-image.jpg file using our AI backend')
  console.log('Expected: The AI should identify food-related content\n')
  
  // Test AI server health first
  try {
    const healthResponse = await fetch(`${AI_SERVER_URL}/health`)
    if (!healthResponse.ok) {
      console.log('❌ AI server is not healthy')
      console.log('💡 Start the AI server with: npm run ai-server')
      return
    }
    console.log('✅ AI server is healthy\n')
  } catch (error) {
    console.log('❌ AI server is not running')
    console.log('💡 Start the AI server with: npm run ai-server')
    return
  }
  
  // Run the image analysis test
  const analysisSuccess = await testSampleImageAnalysis()
  
  if (analysisSuccess) {
    console.log('\n🎉 Sample image analysis completed successfully!')
    console.log('✅ The frontend image recognition flow should work properly')
  } else {
    console.log('\n❌ Sample image analysis failed')
    console.log('🔧 Check the AI server logs for more details')
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runSampleImageTest().catch(console.error)
} 