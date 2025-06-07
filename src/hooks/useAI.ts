import { useState, useCallback } from 'react'
import { aiService, AIAnalysisResult, dataUrlToBase64, generateMerkleRoot } from '@/lib/ai-service'
import { AIAnalysis } from '@/types'
import { useToast } from '@/components/UI/Toast'

interface UseAIReturn {
  isAnalyzing: boolean
  analyzePhoto: (photoDataUrl: string, content?: string) => Promise<AIAnalysis | null>
  analyzeText: (content: string) => Promise<AIAnalysis | null>
  checkAIServerHealth: () => Promise<boolean>
  error: string | null
}

export function useAI(): UseAIReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const analyzePhoto = useCallback(async (photoDataUrl: string, content = ''): Promise<AIAnalysis | null> => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      toast.info('Analyzing photo with AI...')
      
      const imageBase64 = dataUrlToBase64(photoDataUrl)
      const analysisResult: AIAnalysisResult = await aiService.analyzeContent({
        content: content || 'Analyze this photo',
        imageBase64,
        type: content ? 'both' : 'image'
      })

      // Generate embedding for the description
      const embedding = await aiService.generateEmbedding(analysisResult.description)

      // Generate merkle root from analysis data
      const merkleData = [
        analysisResult.description,
        analysisResult.themes.join(','),
        analysisResult.tags.join(','),
        analysisResult.sentiment.toString(),
        imageBase64.substring(0, 100) // First 100 chars of image data for uniqueness
      ]
      
      const merkleRoot = generateMerkleRoot(merkleData)

      const aiAnalysis: AIAnalysis = {
        description: analysisResult.description,
        sentiment: analysisResult.sentiment,
        themes: analysisResult.themes,
        tags: analysisResult.tags,
        confidence: analysisResult.confidence,
        embedding: embedding,
        merkleRoot
      }

      toast.success('Photo analyzed successfully!')
      return aiAnalysis
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI analysis failed'
      setError(errorMessage)
      toast.error(`AI analysis failed: ${errorMessage}`)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [toast])

  const analyzeText = useCallback(async (content: string): Promise<AIAnalysis | null> => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      toast.info('Analyzing text with AI...')
      
      const analysisResult: AIAnalysisResult = await aiService.analyzeContent({
        content,
        type: 'text'
      })

      // Generate embedding for the description
      const embedding = await aiService.generateEmbedding(analysisResult.description)

      // Generate merkle root from analysis data
      const merkleData = [
        analysisResult.description,
        analysisResult.themes.join(','),
        analysisResult.tags.join(','),
        analysisResult.sentiment.toString(),
        content
      ]
      
      const merkleRoot = generateMerkleRoot(merkleData)

      const aiAnalysis: AIAnalysis = {
        description: analysisResult.description,
        sentiment: analysisResult.sentiment,
        themes: analysisResult.themes,
        tags: analysisResult.tags,
        confidence: analysisResult.confidence,
        embedding: embedding,
        merkleRoot
      }

      toast.success('Text analyzed successfully!')
      return aiAnalysis
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI analysis failed'
      setError(errorMessage)
      toast.error(`AI analysis failed: ${errorMessage}`)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [toast])

  const checkAIServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      return await aiService.checkServerHealth()
    } catch (err) {
      console.error('AI server health check failed:', err)
      return false
    }
  }, [])

  return {
    isAnalyzing,
    analyzePhoto,
    analyzeText,
    checkAIServerHealth,
    error
  }
} 