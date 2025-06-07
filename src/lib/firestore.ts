import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import { db } from './firebase'
import { DiaryEntry, AIAnalysis } from '@/types'

// Collection names
const COLLECTIONS = {
  ENTRIES: 'diary_entries',
  USERS: 'users'
} as const

// Firestore document interface
interface FirestoreEntry {
  id: string
  userId: string
  content: string
  photos: string[]
  location?: {
    latitude: number
    longitude: number
    address?: string
    city?: string
    country?: string
    timestamp: number
  }
  mood?: string
  tags: string[]
  aiAnalysis?: {
    description: string
    sentiment: number
    themes: string[]
    tags: string[]
    confidence: number
    embedding: number[]
    merkleRoot?: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  isDraft: boolean
}

// Convert Firestore document to DiaryEntry
function firestoreToEntry(doc: any): DiaryEntry {
  const data = doc.data()
  return {
    id: doc.id,
    content: data.content || '',
    photos: data.photos || [],
    location: data.location,
    mood: data.mood,
    tags: data.tags || [],
    aiAnalysis: data.aiAnalysis,
    createdAt: data.createdAt?.toMillis() || Date.now(),
    updatedAt: data.updatedAt?.toMillis() || Date.now(),
    isDraft: data.isDraft || false
  }
}

// Convert DiaryEntry to Firestore document
function entryToFirestore(entry: DiaryEntry, userId: string): Partial<FirestoreEntry> {
  const firestoreData: any = {
    userId,
    content: entry.content,
    photos: entry.photos,
    tags: entry.tags,
    isDraft: entry.isDraft,
    updatedAt: serverTimestamp()
  }
  
  // Only include fields that aren't undefined (Firestore doesn't support undefined)
  if (entry.location !== undefined) {
    firestoreData.location = entry.location
  }
  if (entry.mood !== undefined) {
    firestoreData.mood = entry.mood
  }
  if (entry.aiAnalysis !== undefined) {
    firestoreData.aiAnalysis = entry.aiAnalysis
  }
  
  return firestoreData
}

export class FirestoreService {
  private static instance: FirestoreService
  
  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService()
    }
    return FirestoreService.instance
  }

  // Create a new diary entry
  async createEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<DiaryEntry> {
    try {
      const entryData = {
        ...entryToFirestore({
          ...entry,
          id: '', // Will be set by Firestore
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as DiaryEntry, userId),
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.ENTRIES), entryData)
      
      // Get the created document to return with proper timestamps
      const doc = await getDoc(docRef)
      return firestoreToEntry(doc)
    } catch (error) {
      console.error('Error creating entry:', error)
      throw error
    }
  }

  // Update an existing diary entry
  async updateEntry(entryId: string, updates: Partial<DiaryEntry>, userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ENTRIES, entryId)
      const updateData = {
        ...entryToFirestore(updates as DiaryEntry, userId),
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('Error updating entry:', error)
      throw error
    }
  }

  // Delete a diary entry
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ENTRIES, entryId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting entry:', error)
      throw error
    }
  }

  // Get all entries for a user
  async getUserEntries(userId: string, limitCount: number = 50): Promise<DiaryEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ENTRIES),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(firestoreToEntry)
    } catch (error) {
      console.error('Error getting user entries:', error)
      throw error
    }
  }

  // Get draft entries for a user
  async getUserDrafts(userId: string): Promise<DiaryEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ENTRIES),
        where('userId', '==', userId),
        where('isDraft', '==', true),
        orderBy('updatedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(firestoreToEntry)
    } catch (error) {
      console.error('Error getting user drafts:', error)
      throw error
    }
  }

  // Search entries by content
  async searchEntries(userId: string, searchQuery: string): Promise<DiaryEntry[]> {
    try {
      // Note: Firestore doesn't have full-text search, so this is a basic implementation
      // For production, consider using Algolia or Elasticsearch
      const q = query(
        collection(db, COLLECTIONS.ENTRIES),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const entries = querySnapshot.docs.map(firestoreToEntry)
      
      // Client-side filtering for search
      const searchLower = searchQuery.toLowerCase()
      return entries.filter(entry => 
        entry.content.toLowerCase().includes(searchLower) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        entry.aiAnalysis?.description.toLowerCase().includes(searchLower) ||
        entry.aiAnalysis?.themes.some(theme => theme.toLowerCase().includes(searchLower))
      )
    } catch (error) {
      console.error('Error searching entries:', error)
      throw error
    }
  }

  // Add AI analysis to an existing entry
  async addAIAnalysis(entryId: string, analysis: AIAnalysis, userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ENTRIES, entryId)
      await updateDoc(docRef, {
        aiAnalysis: analysis,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding AI analysis:', error)
      throw error
    }
  }

  // Offline support
  async enableOffline(): Promise<void> {
    try {
      await enableNetwork(db)
    } catch (error) {
      console.error('Error enabling offline support:', error)
    }
  }

  async disableOffline(): Promise<void> {
    try {
      await disableNetwork(db)
    } catch (error) {
      console.error('Error disabling offline support:', error)
    }
  }

  // Migration helper: Import entries from local storage
  async importLocalEntries(entries: DiaryEntry[], userId: string): Promise<void> {
    try {
      const promises = entries.map(entry => 
        this.createEntry({
          content: entry.content,
          photos: entry.photos,
          location: entry.location,
          mood: entry.mood,
          tags: entry.tags,
          aiAnalysis: entry.aiAnalysis,
          isDraft: entry.isDraft
        }, userId)
      )
      
      await Promise.all(promises)
      console.log(`🔥 Migrated ${entries.length} entries to Firestore`)
    } catch (error) {
      console.error('Error importing local entries:', error)
      throw error
    }
  }
}

export const firestoreService = FirestoreService.getInstance() 