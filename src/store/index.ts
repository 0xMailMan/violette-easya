import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, DiaryEntry, LocationData, UserPreferences, AIAnalysis } from '@/types'
import { firestoreService } from '@/lib/firestore'
import { authService } from '@/lib/auth'

interface AppStore extends AppState {
  // User actions
  completeOnboarding: () => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  setDid: (didId: string) => void

  // Diary actions
  createEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  saveDraft: (entry: Partial<DiaryEntry>) => Promise<void>
  setCurrentEntry: (entry: DiaryEntry | null) => void
  setSearchQuery: (query: string) => void
  setFilterDate: (date: string | undefined) => void
  setFilterTags: (tags: string[]) => void
  addAIAnalysis: (entryId: string, analysis: AIAnalysis) => Promise<void>
  loadEntries: () => Promise<void>
  loadDrafts: () => Promise<void>
  searchEntries: (query: string) => Promise<void>
  migrateLocalData: () => Promise<void>

  // Camera actions
  setCameraActive: (active: boolean) => void
  setCameraPermission: (hasPermission: boolean) => void
  setCapturedPhoto: (photo: string | null) => void
  setCameraStream: (stream: MediaStream | null) => void

  // Location actions
  setLocationEnabled: (enabled: boolean) => void
  setCurrentLocation: (location: LocationData | null) => void
  setLocationPermission: (hasPermission: boolean) => void

  // UI actions
  setActiveModal: (modal: string | null) => void
  setMenuOpen: (open: boolean) => void
  setCurrentRoute: (route: string) => void
  setLoading: (loading: boolean) => void
  showToast: (message: string) => void
  hideToast: () => void
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  locationEnabled: true,
  autoSave: true,
  exportFormat: 'json'
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      user: {
        isOnboarded: false,
        preferences: defaultPreferences,
        didId: null,
        firstLaunch: true
      },
      diary: {
        currentEntry: null,
        draftEntries: [],
        recentEntries: [],
        searchQuery: '',
        filterDate: undefined,
        filterTags: []
      },
      camera: {
        isActive: false,
        hasPermission: null,
        capturedPhoto: null,
        stream: null
      },
      location: {
        isEnabled: true,
        currentLocation: null,
        hasPermission: null
      },
      ui: {
        activeModal: null,
        isMenuOpen: false,
        currentRoute: '/',
        isLoading: false,
        toastMessage: null
      },

      // User actions
      completeOnboarding: () =>
        set((state) => ({
          user: { ...state.user, isOnboarded: true, firstLaunch: false }
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          user: {
            ...state.user,
            preferences: { ...state.user.preferences, ...preferences }
          }
        })),

      setDid: (didId) =>
        set((state) => ({ user: { ...state.user, didId } })),

      // Diary actions
      createEntry: async (entryData) => {
        try {
          const userId = await authService.getUserId()
          const newEntry = await firestoreService.createEntry(entryData, userId)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: [newEntry, ...state.diary.recentEntries],
              currentEntry: null
            }
          }))
        } catch (error) {
          console.error('Error creating entry:', error)
          // Fallback to local storage if Firestore fails
          const newEntry: DiaryEntry = {
            ...entryData,
            id: Date.now().toString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDraft: false
          }
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: [newEntry, ...state.diary.recentEntries],
              currentEntry: null
            }
          }))
        }
      },

      updateEntry: async (id, updates) => {
        try {
          const userId = await authService.getUserId()
          await firestoreService.updateEntry(id, updates, userId)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: state.diary.recentEntries.map((entry) =>
                entry.id === id
                  ? { ...entry, ...updates, updatedAt: Date.now() }
                  : entry
              ),
              draftEntries: state.diary.draftEntries.map((entry) =>
                entry.id === id
                  ? { ...entry, ...updates, updatedAt: Date.now() }
                  : entry
              )
            }
          }))
        } catch (error) {
          console.error('Error updating entry:', error)
        }
      },

      deleteEntry: async (id) => {
        try {
          await firestoreService.deleteEntry(id)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: state.diary.recentEntries.filter(entry => entry.id !== id),
              draftEntries: state.diary.draftEntries.filter(entry => entry.id !== id)
            }
          }))
        } catch (error) {
          console.error('Error deleting entry:', error)
        }
      },

      saveDraft: async (entryData) => {
        try {
          const userId = await authService.getUserId()
          const draftData = {
            ...entryData,
            content: entryData.content || '',
            photos: entryData.photos || [],
            tags: entryData.tags || [],
            isDraft: true
          }
          
          if (entryData.id) {
            // Update existing draft
            await firestoreService.updateEntry(entryData.id, draftData, userId)
          } else {
            // Create new draft
            const newDraft = await firestoreService.createEntry(draftData, userId)
            set((state) => ({
              diary: {
                ...state.diary,
                draftEntries: [newDraft, ...state.diary.draftEntries]
              }
            }))
            return
          }
          
          // Update local state for existing draft
          set((state) => ({
            diary: {
              ...state.diary,
              draftEntries: state.diary.draftEntries.map(draft =>
                draft.id === entryData.id
                  ? { ...draft, ...draftData, updatedAt: Date.now() }
                  : draft
              )
            }
          }))
        } catch (error) {
          console.error('Error saving draft:', error)
        }
      },

      setCurrentEntry: (entry) =>
        set((state) => ({
          diary: { ...state.diary, currentEntry: entry }
        })),

      setSearchQuery: (query) =>
        set((state) => ({
          diary: { ...state.diary, searchQuery: query }
        })),

      setFilterDate: (date) =>
        set((state) => ({
          diary: { ...state.diary, filterDate: date }
        })),

      setFilterTags: (tags) =>
        set((state) => ({
          diary: { ...state.diary, filterTags: tags }
        })),

      addAIAnalysis: async (entryId, analysis) => {
        try {
          const userId = await authService.getUserId()
          await firestoreService.addAIAnalysis(entryId, analysis, userId)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: state.diary.recentEntries.map((entry) =>
                entry.id === entryId
                  ? { ...entry, aiAnalysis: analysis, updatedAt: Date.now() }
                  : entry
              ),
              draftEntries: state.diary.draftEntries.map((entry) =>
                entry.id === entryId
                  ? { ...entry, aiAnalysis: analysis, updatedAt: Date.now() }
                  : entry
              )
            }
          }))
        } catch (error) {
          console.error('Error adding AI analysis:', error)
        }
      },

      loadEntries: async () => {
        try {
          const userId = await authService.getUserId()
          const entries = await firestoreService.getUserEntries(userId)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: entries
            }
          }))
        } catch (error) {
          console.error('Error loading entries:', error)
        }
      },

      loadDrafts: async () => {
        try {
          const userId = await authService.getUserId()
          const drafts = await firestoreService.getUserDrafts(userId)
          
          set((state) => ({
            diary: {
              ...state.diary,
              draftEntries: drafts
            }
          }))
        } catch (error) {
          console.error('Error loading drafts:', error)
        }
      },

      searchEntries: async (query) => {
        try {
          const userId = await authService.getUserId()
          const entries = await firestoreService.searchEntries(userId, query)
          
          set((state) => ({
            diary: {
              ...state.diary,
              recentEntries: entries,
              searchQuery: query
            }
          }))
        } catch (error) {
          console.error('Error searching entries:', error)
        }
      },

      migrateLocalData: async () => {
        try {
          const currentState = useAppStore.getState()
          const localEntries = currentState.diary.recentEntries
          
          if (localEntries.length > 0) {
            const userId = await authService.getUserId()
            await firestoreService.importLocalEntries(localEntries, userId)
            console.log('🔥 Successfully migrated local data to Firestore')
          }
        } catch (error) {
          console.error('Error migrating local data:', error)
        }
      },

      // Camera actions
      setCameraActive: (active) =>
        set((state) => ({
          camera: { ...state.camera, isActive: active }
        })),

      setCameraPermission: (hasPermission) =>
        set((state) => ({
          camera: { ...state.camera, hasPermission }
        })),

      setCapturedPhoto: (photo) =>
        set((state) => ({
          camera: { ...state.camera, capturedPhoto: photo }
        })),

      setCameraStream: (stream) =>
        set((state) => ({
          camera: { ...state.camera, stream }
        })),

      // Location actions
      setLocationEnabled: (enabled) =>
        set((state) => ({
          location: { ...state.location, isEnabled: enabled }
        })),

      setCurrentLocation: (location) =>
        set((state) => ({
          location: { ...state.location, currentLocation: location }
        })),

      setLocationPermission: (hasPermission) =>
        set((state) => ({
          location: { ...state.location, hasPermission }
        })),

      // UI actions
      setActiveModal: (modal) =>
        set((state) => ({
          ui: { ...state.ui, activeModal: modal }
        })),

      setMenuOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, isMenuOpen: open }
        })),

      setCurrentRoute: (route) =>
        set((state) => ({
          ui: { ...state.ui, currentRoute: route }
        })),

      setLoading: (loading) =>
        set((state) => ({
          ui: { ...state.ui, isLoading: loading }
        })),

      showToast: (message) =>
        set((state) => ({
          ui: { ...state.ui, toastMessage: message }
        })),

      hideToast: () =>
        set((state) => ({
          ui: { ...state.ui, toastMessage: null }
        }))
    }),
    {
      name: 'diary-app-storage',
      partialize: (state) => ({
        user: state.user,
        diary: {
          recentEntries: state.diary.recentEntries,
          draftEntries: state.diary.draftEntries,
          currentEntry: state.diary.currentEntry,
          searchQuery: state.diary.searchQuery,
          filterDate: state.diary.filterDate,
          filterTags: state.diary.filterTags
        }
      }),
      // Add storage error handling
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate storage:', error)
        }
      }
    }
  )
) 