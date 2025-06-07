// AI Service for communicating with Anthropic backend
export interface AIAnalysisResult {
  description: string
  sentiment: number
  themes: string[]
  tags: string[]
  confidence: number
  embedding: number[]
}

export interface AIAnalysisRequest {
  content: string
  imageBase64?: string
  type: 'text' | 'image' | 'both'
}

const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000'

export class AIService {
  private static instance: AIService
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      // Transform request to match server's expected format
      const serverRequest: any = {}
      
      if (request.content) {
        serverRequest.text = request.content
      }
      
      if (request.imageBase64) {
        serverRequest.photo = request.imageBase64
      }

      const response = await fetch(`${AI_SERVER_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverRequest)
      })

      if (!response.ok) {
        throw new Error(`AI Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Transform server response to match our interface
      if (result.success && result.data) {
        const data = result.data
        return {
          description: data.description || '',
          sentiment: data.sentiment || 0,
          themes: data.themes || [],
          tags: data.suggestedTags || [],
          confidence: data.confidence || 0,
          embedding: [] // Will be generated separately
        }
      } else {
        throw new Error(result.error || 'AI Analysis failed')
      }
    } catch (error) {
      console.error('AI Analysis error:', error)
      throw error
    }
  }

  async generateEmbedding(content: string): Promise<number[]> {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/ai/generate-embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: content })
      })

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        return result.data.embedding
      } else {
        throw new Error(result.error || 'Embedding generation failed')
      }
    } catch (error) {
      console.error('Embedding generation error:', error)
      throw error
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${AI_SERVER_URL}/health`)
      return response.ok
    } catch (error) {
      console.error('AI Server health check failed:', error)
      return false
    }
  }
}

// Utility function to convert data URL to base64
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1]
}

// Merkle tree utility for generating merkle root
export function generateMerkleRoot(data: string[]): string {
  if (data.length === 0) return ''
  if (data.length === 1) return hashString(data[0])
  
  const hashes = data.map(hashString)
  return buildMerkleTree(hashes)
}

function hashString(input: string): string {
  // Simple hash function for demo purposes
  // In production, use a proper crypto hash like SHA-256
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

function buildMerkleTree(hashes: string[]): string {
  if (hashes.length === 1) return hashes[0]
  
  const nextLevel: string[] = []
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]
    const right = hashes[i + 1] || left // Handle odd number of elements
    nextLevel.push(hashString(left + right))
  }
  
  return buildMerkleTree(nextLevel)
}

export const aiService = AIService.getInstance() 