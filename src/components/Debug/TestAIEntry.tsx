'use client'

import { useAppStore } from '@/store'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/UI/Button'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export function TestAIEntry() {
  const [isCreating, setIsCreating] = useState(false)
  const { createEntry } = useAppStore()
  const { analyzeText } = useAI()

  const createTestEntry = async () => {
    setIsCreating(true)
    try {
      const testText = "I had a wonderful lunch today! Delicious pasta with fresh basil and tomatoes. The sunset through the restaurant window was absolutely beautiful."
      
      // Analyze the text with AI
      const aiAnalysis = await analyzeText(testText)
      
      // Create entry with AI analysis
      const entryData = {
        content: testText,
        photos: [],
        tags: aiAnalysis?.tags || [],
        mood: undefined,
        location: undefined,
        aiAnalysis: aiAnalysis
      }
      
      createEntry(entryData)
      console.log('Test entry created with AI analysis:', aiAnalysis)
      
    } catch (error) {
      console.error('Failed to create test entry:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={createTestEntry}
        disabled={isCreating}
        className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
        size="sm"
      >
        {isCreating ? (
          <>
            <SparklesIcon className="h-4 w-4 mr-1 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <SparklesIcon className="h-4 w-4 mr-1" />
            Test AI Entry
          </>
        )}
      </Button>
    </div>
  )
} 