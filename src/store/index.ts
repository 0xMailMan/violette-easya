import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, DiaryEntry, LocationData, UserPreferences } from '@/types'

interface AppStore extends AppState {
  // User actions
  completeOnboarding: () => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  setDid: (didId: string) => void

  // Diary actions
  createEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void
  deleteEntry: (id: string) => void
  saveDraft: (entry: Partial<DiaryEntry>) => void
  setCurrentEntry: (entry: DiaryEntry | null) => void
  setSearchQuery: (query: string) => void
  setFilterDate: (date: string | undefined) => void
  setFilterTags: (tags: string[]) => void

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
      createEntry: (entryData) => {
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
      },

      updateEntry: (id, updates) =>
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
        })),

      deleteEntry: (id) =>
        set((state) => ({
          diary: {
            ...state.diary,
            recentEntries: state.diary.recentEntries.filter(entry => entry.id !== id),
            draftEntries: state.diary.draftEntries.filter(entry => entry.id !== id)
          }
        })),

      saveDraft: (entryData) => {
        const draft: DiaryEntry = {
          id: entryData.id || `draft-${Date.now()}`,
          content: entryData.content || '',
          photos: entryData.photos || [],
          location: entryData.location,
          mood: entryData.mood,
          tags: entryData.tags || [],
          createdAt: entryData.createdAt || Date.now(),
          updatedAt: Date.now(),
          isDraft: true
        }
        set((state) => {
          const existingDraftIndex = state.diary.draftEntries.findIndex(d => d.id === draft.id)
          const newDrafts = [...state.diary.draftEntries]
          if (existingDraftIndex >= 0) {
            newDrafts[existingDraftIndex] = draft
          } else {
            newDrafts.unshift(draft)
          }
          return {
            diary: { ...state.diary, draftEntries: newDrafts }
          }
        })
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
          draftEntries: state.diary.draftEntries
        }
      })
    }
  )
) 