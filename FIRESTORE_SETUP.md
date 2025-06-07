# 🔥 Firestore Integration Setup

## Overview
Your Violette EasyA diary now includes **Firestore integration** for cloud storage and synchronization! This enables:

- ✅ **Anonymous Authentication** - Privacy-first user accounts
- ✅ **Cloud Storage** - Diary entries synced across devices  
- ✅ **Offline Support** - Works without internet, syncs when online
- ✅ **Real-time Sync** - Changes appear instantly across devices
- ✅ **Data Migration** - Existing local entries automatically migrated

## Quick Start (Demo Mode)

The app works immediately with demo configuration:

```bash
npm run dev
```

The app will:
1. Sign you in anonymously 
2. Migrate any existing local entries to Firestore
3. Show your anonymous user ID in Settings
4. Sync all new entries to the cloud

## Production Setup

For production deployment, create a Firebase project:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `violette-easya`
3. Enable **Firestore Database**
4. Enable **Authentication** → **Anonymous** provider

### 2. Configure Environment Variables
Create `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Optional: Enable Firebase Emulator for development
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# Anthropic API (existing)
ANTHROPIC_API_KEY=your-anthropic-key
```

### 3. Firestore Security Rules
In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own diary entries
    match /diary_entries/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read/write their own user data
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

## Testing

Test Firestore integration:

```bash
# Test basic Firestore connectivity
npm run test:firestore

# Test full app with Firestore
npm run dev
```

## Features

### Anonymous Authentication
- **Privacy First**: No email, phone, or personal info required
- **Automatic**: Signs in automatically on first visit
- **Persistent**: Same anonymous account across browser sessions
- **Secure**: Each user gets unique, unguessable ID

### Cloud Storage
- **Automatic Sync**: All diary entries saved to Firestore
- **Real-time**: Changes appear instantly across devices
- **Offline Support**: Works offline, syncs when online
- **Migration**: Existing local entries automatically migrated

### Data Structure
```typescript
// Firestore Document: /diary_entries/{entryId}
{
  userId: string,           // Anonymous user ID
  content: string,          // Diary entry text
  photos: string[],         // Base64 photo data
  location?: Location,      // GPS coordinates (if enabled)
  mood?: string,           // User-selected mood
  tags: string[],          // Entry tags
  aiAnalysis?: {           // AI analysis from Anthropic
    description: string,
    sentiment: number,
    themes: string[],
    tags: string[],
    confidence: number,
    embedding: number[],
    merkleRoot?: string
  },
  createdAt: Timestamp,    // Creation time
  updatedAt: Timestamp,    // Last update time
  isDraft: boolean         // Draft status
}
```

## Privacy & Security

### Anonymous Authentication
- No personal information stored or tracked
- Each user gets cryptographically secure anonymous ID
- No way to link anonymous ID to real identity
- User can "reset" by clearing browser data

### Data Encryption
- All data encrypted in transit (HTTPS/TLS)
- Firestore encrypts data at rest
- Photos stored as base64 in Firestore documents
- AI embeddings stored as encrypted vectors

### Access Control
- Users can only access their own data
- Firestore security rules enforce user isolation
- No admin access to user data without explicit permission
- Anonymous accounts cannot be linked or tracked

## Troubleshooting

### Common Issues

**"Permission denied" errors:**
- Check Firestore security rules are configured
- Ensure anonymous authentication is enabled
- Verify user is signed in (check Settings page)

**Entries not syncing:**
- Check internet connection
- Look for errors in browser console
- Verify Firebase configuration

**Migration not working:**
- Check browser console for migration logs
- Existing entries should appear in Firestore after first load

### Debug Commands

```bash
# Check Firestore connectivity
npm run test:firestore

# View detailed logs
# Open browser console and look for 🔥 Firestore logs

# Reset local data (for testing)
# Clear browser localStorage and refresh
```

## Next Steps

With Firestore integrated, you can now:

1. **Deploy to Production** - Your diary works across devices
2. **Add XRPL Blockchain** - For immutable diary proofs
3. **Implement Discovery** - Find similar anonymous entries
4. **Add Real-time Features** - Live collaboration or sharing

The foundation is now ready for advanced features! 🚀 