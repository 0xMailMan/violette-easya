// Test Firestore integration
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore')
const { getAuth, signInAnonymously } = require('firebase/auth')

// Load environment variables
require('dotenv').config()

// Firebase config from environment variables
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

async function testFirestore() {
  try {
    console.log('🔥 Testing Firestore integration...')
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    const auth = getAuth(app)
    
    // Sign in anonymously
    console.log('🔐 Signing in anonymously...')
    const userCredential = await signInAnonymously(auth)
    const userId = userCredential.user.uid
    console.log('✅ Signed in with UID:', userId.substring(0, 8) + '...')
    
    // Test creating a diary entry
    console.log('📝 Creating test diary entry...')
    const testEntry = {
      userId: userId,
      content: 'Test entry from Firestore integration test',
      photos: [],
      tags: ['test', 'firestore'],
      aiAnalysis: {
        description: 'A test entry to verify Firestore functionality',
        sentiment: 0.8,
        themes: ['Testing', 'Integration'],
        tags: ['test', 'firestore'],
        confidence: 0.95,
        embedding: Array(256).fill(0).map(() => Math.random()),
        merkleRoot: 'test-merkle-root-' + Date.now()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isDraft: false
    }
    
    const docRef = await addDoc(collection(db, 'diary_entries'), testEntry)
    console.log('✅ Entry created with ID:', docRef.id)
    
    // Test reading entries
    console.log('📖 Reading entries for user...')
    const q = query(
      collection(db, 'diary_entries'),
      where('userId', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    console.log('✅ Found', querySnapshot.size, 'entries for user')
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('  - Entry:', doc.id, '|', data.content.substring(0, 50) + '...')
    })
    
    console.log('🎉 Firestore integration test completed successfully!')
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error)
    
    if (error.code === 'permission-denied') {
      console.log('💡 This is expected if Firestore security rules are not configured for demo mode')
      console.log('💡 The app will work with proper Firebase project setup')
    }
  }
}

// Run the test
testFirestore() 