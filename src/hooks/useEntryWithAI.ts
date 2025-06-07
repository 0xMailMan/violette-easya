import { useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { useAI } from './useAI'
import { useToast } from '@/components/UI/Toast'
import { DiaryEntry, AIAnalysis } from '@/types'

interface CreateEntryWithAIOptions {
  content?: string
  photos?: string[]
  tags?: string[]
  mood?: string
  location?: any
  isDraft?: boolean
}

interface UseEntryWithAIReturn {
  isProcessing: boolean
  createEntryWithAI: (options: CreateEntryWithAIOptions) => Promise<DiaryEntry | null>
  error: string | null
}

export function useEntryWithAI(): UseEntryWithAIReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { createEntry } = useAppStore()
  const { analyzePhoto, analyzeText, isAnalyzing } = useAI()
  const toast = useToast()

  const createEntryWithAI = useCallback(async (options: CreateEntryWithAIOptions): Promise<DiaryEntry | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      console.log('🚀 Creating entry with AI analysis...')
      console.log('📝 Entry options:', { ...options, photos: options.photos?.map(() => '[photo]') })

      let aiAnalysis: AIAnalysis | null = null

      // Determine what to analyze
      const hasPhotos = options.photos && options.photos.length > 0
      const hasContent = options.content && options.content.trim().length > 0

      if (hasPhotos && hasContent) {
        // Analyze both photo and text
        console.log('🖼️ + 📝 Analyzing photo with text content...')
        toast.info('Analyzing photo and text with AI...')
        
        // Use the first photo for analysis
        aiAnalysis = await analyzePhoto(options.photos![0], options.content!)
        
      } else if (hasPhotos) {
        // Analyze photo only
        console.log('🖼️ Analyzing photo only...')
        toast.info('Analyzing photo with AI...')
        
        // Use the first photo for analysis
        aiAnalysis = await analyzePhoto(options.photos![0], 'Analyze this photo')
        
      } else if (hasContent) {
        // Analyze text only
        console.log('📝 Analyzing text only...')
        toast.info('Analyzing text with AI...')
        
        aiAnalysis = await analyzeText(options.content!)
        
      } else {
        // No content to analyze
        console.log('⚠️ No content to analyze, creating entry without AI analysis')
      }

      console.log('📊 AI Analysis result:', aiAnalysis)

      // Create the entry data
      const entryData: any = {
        content: options.content || (hasPhotos ? 'Photo entry' : ''),
        photos: options.photos || [],
        tags: [
          ...(options.tags || []),
          ...(aiAnalysis?.tags || [])
        ],
        isDraft: options.isDraft || false
      }

      // Only include optional fields if they exist
      if (options.mood) {
        entryData.mood = options.mood
      }
      
      if (options.location) {
        entryData.location = options.location
      }

      // Include AI analysis if available
      if (aiAnalysis) {
        entryData.aiAnalysis = aiAnalysis
        console.log('✅ Including AI analysis in entry')
        toast.success('AI analysis complete!')
      } else {
        console.log('⚠️ No AI analysis available')
        if (hasPhotos || hasContent) {
          toast.warning('Entry saved without AI analysis')
        }
      }

      console.log('💾 Creating entry in Firestore...')
      const createdEntry = await createEntry(entryData)
      
      console.log('✅ Entry created successfully in Firestore with ID:', (createdEntry as any)?.id)
      
      // Verify AI analysis was stored
      if (aiAnalysis && (createdEntry as any)?.aiAnalysis) {
        console.log('✅ AI analysis confirmed stored in Firestore')
      } else if (aiAnalysis) {
        console.log('⚠️ AI analysis may not have been stored properly')
      }

      return createdEntry as DiaryEntry

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entry'
      console.error('❌ Error creating entry with AI:', err)
      setError(errorMessage)
      toast.error(`Failed to create entry: ${errorMessage}`)
      return null
      
    } finally {
      setIsProcessing(false)
    }
  }, [createEntry, analyzePhoto, analyzeText, toast])

  return {
    isProcessing: isProcessing || isAnalyzing,
    createEntryWithAI,
    error
  }
}

// Convenience functions for specific entry types
export function usePhotoEntryWithAI() {
  const { isProcessing, createEntryWithAI, error } = useEntryWithAI()
  
  const createPhotoEntry = useCallback(async (photos: string[], content?: string, options?: Partial<CreateEntryWithAIOptions>) => {
    return createEntryWithAI({
      photos,
      content,
      ...options
    })
  }, [createEntryWithAI])

  return { isProcessing, createPhotoEntry, error }
}

export function useTextEntryWithAI() {
  const { isProcessing, createEntryWithAI, error } = useEntryWithAI()
  
  const createTextEntry = useCallback(async (content: string, options?: Partial<CreateEntryWithAIOptions>) => {
    return createEntryWithAI({
      content,
      ...options
    })
  }, [createEntryWithAI])

  return { isProcessing, createTextEntry, error }
} 