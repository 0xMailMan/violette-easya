require('dotenv').config()
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore')
const { getAuth, signInAnonymously } = require('firebase/auth')

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function testEntryCreation() {
  try {
    console.log('🧪 Testing Entry Creation with ID Return...')
    
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth)
    const userId = userCredential.user.uid
    console.log('✅ Signed in with userId:', userId.substring(0, 8) + '...')
    
    // Create a test entry with AI analysis
    const entryData = {
      userId,
      content: 'Test entry with AI analysis',
      photos: [],
      tags: ['test', 'ai-analysis'],
      isDraft: false,
      aiAnalysis: {
        description: 'Test AI analysis description',
        sentiment: 0.5,
        themes: ['testing', 'verification'],
        tags: ['automated', 'test'],
        confidence: 0.95,
        embedding: [0.1, 0.2, 0.3],
        merkleRoot: 'test123'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    console.log('💾 Creating entry in Firestore...')
    const docRef = await addDoc(collection(db, 'diary_entries'), entryData)
    
    console.log('✅ Entry created successfully!')
    console.log('📄 Document ID:', docRef.id)
    console.log('🔍 AI Analysis included:', !!entryData.aiAnalysis)
    console.log('📊 AI Description:', entryData.aiAnalysis.description.substring(0, 50) + '...')
    
    if (docRef.id) {
      console.log('🎉 SUCCESS: Entry creation returns proper ID')
      console.log('📝 Entry ID format:', docRef.id)
    } else {
      console.error('❌ FAILED: Entry creation did not return ID')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEntryCreation() 