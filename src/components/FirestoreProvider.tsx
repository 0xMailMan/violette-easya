'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { authService } from '@/lib/auth'

interface FirestoreProviderProps {
  children: React.ReactNode
}

export function FirestoreProvider({ children }: FirestoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { loadEntries, loadDrafts, migrateLocalData } = useAppStore()

  useEffect(() => {
    const initializeFirestore = async () => {
      try {
        // Ensure user is authenticated (anonymous)
        await authService.ensureAuthenticated()
        
        // Check if we have local data to migrate
        const currentState = useAppStore.getState()
        const hasLocalData = currentState.diary.recentEntries.length > 0
        
        if (hasLocalData) {
          // Migrate local data first
          await migrateLocalData()
          console.log('🔥 Local data migrated to Firestore')
        }
        
        // Load entries and drafts from Firestore
        await Promise.all([
          loadEntries(),
          loadDrafts()
        ])
        
        console.log('🔥 Firestore initialized and data loaded')
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing Firestore:', error)
        // Still mark as initialized to allow app to work without Firestore
        setIsInitialized(true)
      }
    }

    initializeFirestore()
  }, [loadEntries, loadDrafts, migrateLocalData])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-700 font-medium">Initializing your diary...</p>
          <p className="text-purple-500 text-sm mt-1">Setting up secure storage</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 