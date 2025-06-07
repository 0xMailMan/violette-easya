'use client'

import { useEffect, useState, Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { detectStorageIssues } from '@/lib/storage'
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface StorageDebuggerProps {
  showInProduction?: boolean
}

export function StorageDebugger({ showInProduction = false }: StorageDebuggerProps) {
  const [issues, setIssues] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Only show in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || showInProduction) {
      const detectedIssues = detectStorageIssues()
      setIssues(detectedIssues)
      setIsVisible(detectedIssues.length > 0)
    }
  }, [showInProduction])

  // Auto-collapse after 5 seconds
  useEffect(() => {
    if (isVisible && !isCollapsed) {
      const collapseTimer = setTimeout(() => {
        setIsCollapsed(true)
      }, 5000) // Collapse after 5 seconds

      return () => clearTimeout(collapseTimer)
    }
  }, [isVisible, isCollapsed])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!isVisible || issues.length === 0) {
    return null
  }

  // Collapsed state - show as small icon
  if (isCollapsed) {
    return (
      <div
        className={cn(
          'fixed top-4 left-4 z-50 transition-all duration-300 cursor-pointer',
          'hover:scale-110 active:scale-95'
        )}
        onClick={handleToggleCollapse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 bg-yellow-100 border-yellow-300 hover:bg-yellow-200 transition-all duration-200">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
        </div>
        
        {/* Tooltip on hover */}
        <Transition
          show={isHovered}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap max-w-xs">
            Storage Issues Detected ({issues.length} issue{issues.length !== 1 ? 's' : ''})
            <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        </Transition>
      </div>
    )
  }

  // Expanded state - show full popup
  return (
    <Transition
      show={!isCollapsed}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
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
                    <li>• Ensure you&apos;re using HTTPS in production</li>
                    <li>• Check browser privacy settings</li>
                    <li>• Disable conflicting browser extensions</li>
                    <li>• Try incognito mode to test without extensions</li>
                    <li>• Clear browser cache and storage</li>
                    <li>• Refresh the page to retry service worker</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
              <button
                onClick={handleToggleCollapse}
                className="rounded-md p-1 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 touch-target"
                title="Minimize"
              >
                <span className="sr-only">Minimize</span>
                <ChevronDownIcon className="h-4 w-4 text-yellow-600" />
              </button>
              
              <button
                onClick={handleDismiss}
                className="rounded-md p-1 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 touch-target"
                title="Close"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-4 w-4 text-yellow-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
} 