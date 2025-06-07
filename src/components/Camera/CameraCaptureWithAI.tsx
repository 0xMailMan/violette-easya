'use client'

import { useState, useRef, useCallback } from 'react'
import { CameraCapture } from './CameraCapture'
import { useAppStore } from '@/store'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils'

interface CameraCaptureWithAIProps {
  onClose?: () => void
  className?: string
}

export function CameraCaptureWithAI({ onClose, className }: CameraCaptureWithAIProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [entryContent, setEntryContent] = useState('')
  const [showAIResults, setShowAIResults] = useState(false)
  const previewPhotoRef = useRef<string | null>(null)
  
  const { createEntry, addAIAnalysis } = useAppStore()
  const { isAnalyzing, analyzePhoto, error } = useAI()

  const handlePhotoCapture = useCallback((photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl)
    previewPhotoRef.current = photoDataUrl
    setShowPreview(true)
  }, [])

  const handleSaveEntry = useCallback(async () => {
    if (!capturedPhoto) return

    try {
      // Analyze photo with AI first
      const aiAnalysis = await analyzePhoto(capturedPhoto, entryContent)
      
      // Create diary entry with AI analysis included
      const entryData = {
        content: entryContent || 'Photo captured',
        photos: [capturedPhoto],
        tags: aiAnalysis?.tags || [],
        mood: undefined,
        location: undefined,
        aiAnalysis: aiAnalysis
      }
      
      createEntry(entryData)
      setShowAIResults(true)
      
      // Reset state after showing success
      setTimeout(() => {
        setShowPreview(false)
        setCapturedPhoto(null)
        setEntryContent('')
        setShowAIResults(false)
        if (onClose) onClose()
      }, 3000) // Show results for 3 seconds
      
    } catch (error) {
      console.error('Error saving entry with AI analysis:', error)
      // Still create entry without AI analysis if AI fails
      const entryData = {
        content: entryContent || 'Photo captured',
        photos: [capturedPhoto],
        tags: [],
        mood: undefined,
        location: undefined
      }
      createEntry(entryData)
    }
  }, [capturedPhoto, entryContent, createEntry, analyzePhoto, onClose])

  const handleRetakePhoto = useCallback(() => {
    setShowPreview(false)
    setCapturedPhoto(null)
    setEntryContent('')
    previewPhotoRef.current = null
  }, [])

  if (showPreview && capturedPhoto) {
    return (
      <Modal 
        isOpen={true} 
        onClose={() => setShowPreview(false)}
        title="Photo Preview"
        className="max-w-lg"
      >
        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="relative">
            <img 
              src={capturedPhoto} 
              alt="Captured photo" 
              className="w-full h-64 object-cover rounded-lg"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-2 text-white">
                  <SparklesIcon className="h-6 w-6 animate-spin" />
                  <span>Analyzing with AI...</span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add a caption (optional)
            </label>
            <textarea
              value={entryContent}
              onChange={(e) => setEntryContent(e.target.value)}
              placeholder="What's happening in this photo?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              disabled={isAnalyzing}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <XCircleIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* AI Results Preview */}
          {showAIResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">AI Analysis Complete!</span>
              </div>
              <p className="text-green-700 text-sm">
                Photo has been analyzed and merkle root generated. 
                Check the Gallery to see the full AI description.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleRetakePhoto}
              disabled={isAnalyzing}
              className="flex-1"
            >
              Retake
            </Button>
            <Button
              onClick={handleSaveEntry}
              disabled={isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <SparklesIcon className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : showAIResults ? (
                'Complete!'
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  Save & Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <CameraCapture
      onPhotoCapture={handlePhotoCapture}
      onClose={onClose}
      className={className}
    />
  )
} 