'use client'

import { useEffect, useState } from 'react'
import { detectStorageIssues } from '@/lib/storage'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface StorageDebuggerProps {
  showInProduction?: boolean
}

export function StorageDebugger({ showInProduction = false }: StorageDebuggerProps) {
  const [issues, setIssues] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || showInProduction) {
      const detectedIssues = detectStorageIssues()
      setIssues(detectedIssues)
      setIsVisible(detectedIssues.length > 0)
    }
  }, [showInProduction])

  if (!isVisible || issues.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Storage Issues Detected
            </h3>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-3 flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="ml-2">
                <p className="text-xs text-yellow-600">
                  <strong>Tips:</strong>
                </p>
                <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                  <li>• Ensure you're using HTTPS in production</li>
                  <li>• Check browser privacy settings</li>
                  <li>• Disable conflicting browser extensions</li>
                  <li>• Try incognito mode to test without extensions</li>
                  <li>• Clear browser cache and storage</li>
                  <li>• Refresh the page to retry service worker</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="mt-3 text-xs text-yellow-600 underline hover:no-underline focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 