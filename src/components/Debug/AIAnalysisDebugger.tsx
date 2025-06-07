'use client'

import { useAppStore } from '@/store'
import { SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export function AIAnalysisDebugger() {
  const [isVisible, setIsVisible] = useState(false)
  const { diary } = useAppStore()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors"
          title="Show AI Analysis Debug Info"
        >
          <SparklesIcon className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-auto">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <SparklesIcon className="h-4 w-4 mr-1" />
          AI Analysis Debug
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <EyeSlashIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-3 space-y-3">
        <div className="text-sm">
          <strong>Total Entries:</strong> {diary.recentEntries.length}
        </div>
        
        {diary.recentEntries.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No entries found. Take a photo to create one!
          </div>
        ) : (
          diary.recentEntries.map((entry, index) => (
            <div key={entry.id} className="border border-gray-200 rounded p-2 text-xs">
              <div className="font-medium">Entry #{index + 1}</div>
              <div className="text-gray-600">ID: {entry.id}</div>
              <div className="text-gray-600">Content: {entry.content.substring(0, 50)}...</div>
              <div className="text-gray-600">Photos: {entry.photos.length}</div>
              <div className="text-gray-600">Tags: {entry.tags.length}</div>
              
              {entry.aiAnalysis ? (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">✅ AI Analysis Present</div>
                  <div className="text-green-700">
                    Description: {entry.aiAnalysis.description.substring(0, 60)}...
                  </div>
                  <div className="text-green-700">
                    Sentiment: {entry.aiAnalysis.sentiment.toFixed(2)}
                  </div>
                  <div className="text-green-700">
                    Themes: {entry.aiAnalysis.themes.length}
                  </div>
                  <div className="text-green-700">
                    Tags: {entry.aiAnalysis.tags.length}
                  </div>
                  <div className="text-green-700">
                    Confidence: {Math.round(entry.aiAnalysis.confidence * 100)}%
                  </div>
                  {entry.aiAnalysis.merkleRoot && (
                    <div className="text-green-700">
                      Merkle: {entry.aiAnalysis.merkleRoot.substring(0, 12)}...
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">❌ No AI Analysis</div>
                </div>
              )}
            </div>
          ))
        )}
        
        <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
          💡 Take a photo using the camera to test AI analysis
        </div>
      </div>
    </div>
  )
} 