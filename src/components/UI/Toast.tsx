'use client'

import { Fragment, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  isCollapsible?: boolean
}

const toastIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const toastIconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
}

function ToastItem({ 
  message, 
  type = 'info', 
  duration = 5000, 
  action,
  isCollapsible = false
}: ToastProps) {
  const hideToast = useAppStore(state => state.hideToast)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const Icon = toastIcons[type]

  // Auto-collapse error and warning messages after a short delay
  useEffect(() => {
    if (isCollapsible && (type === 'error' || type === 'warning')) {
      const collapseTimer = setTimeout(() => {
        setIsCollapsed(true)
      }, 3000) // Collapse after 3 seconds

      return () => clearTimeout(collapseTimer)
    }
  }, [isCollapsible, type])

  useEffect(() => {
    if (duration > 0 && !isCollapsible) {
      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, hideToast, isCollapsible])

  // Don't auto-hide collapsible toasts
  const handleDismiss = () => {
    if (isCollapsible) {
      setIsCollapsed(true)
      // Hide completely after collapse animation
      setTimeout(() => {
        hideToast()
      }, 300)
    } else {
      hideToast()
    }
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (isCollapsible && isCollapsed) {
    return (
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 transition-all duration-300 cursor-pointer',
          'hover:scale-110 active:scale-95'
        )}
        onClick={handleToggleCollapse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2',
            'transition-all duration-200',
            type === 'error' && 'bg-red-100 border-red-300 hover:bg-red-200',
            type === 'warning' && 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
            type === 'info' && 'bg-blue-100 border-blue-300 hover:bg-blue-200',
            type === 'success' && 'bg-green-100 border-green-300 hover:bg-green-200'
          )}
        >
          <Icon className={cn('h-6 w-6', toastIconColors[type])} />
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
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap max-w-xs">
            {message}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </Transition>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full transition-all duration-300',
        toastStyles[type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>
        
        {action && (
          <div className="mt-2">
            <button
              onClick={action.onClick}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
        {isCollapsible && (
          <button
            onClick={handleToggleCollapse}
            className="rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 touch-target"
            title="Minimize"
          >
            <span className="sr-only">Minimize</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
        
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 touch-target"
          title="Close"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toastMessage = useAppStore(state => state.ui.toastMessage)
  const isVisible = Boolean(toastMessage)

  if (!toastMessage) return null

  // Parse message if it includes type information
  let message = toastMessage
  let type: ToastType = 'info'
  
  if (toastMessage.startsWith('[') && toastMessage.includes(']')) {
    const match = toastMessage.match(/^\[(\w+)\](.+)/)
    if (match) {
      const [, typeStr, messageStr] = match
      if (['success', 'error', 'warning', 'info'].includes(typeStr)) {
        type = typeStr as ToastType
        message = messageStr.trim()
      }
    }
  }

  // Make error and warning messages collapsible
  const isCollapsible = type === 'error' || type === 'warning'

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <Transition
        show={isVisible}
        as={Fragment}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="pointer-events-auto">
          <ToastItem 
            message={message} 
            type={type} 
            duration={isCollapsible ? 0 : 5000} // Don't auto-hide collapsible toasts
            isCollapsible={isCollapsible}
          />
        </div>
      </Transition>
    </div>
  )
}

// Hook for easy toast usage
export function useToast() {
  const showToast = useAppStore(state => state.showToast)

  return {
    success: (message: string) => showToast(`[success]${message}`),
    error: (message: string) => showToast(`[error]${message}`),
    warning: (message: string) => showToast(`[warning]${message}`),
    info: (message: string) => showToast(`[info]${message}`),
    show: showToast,
  }
} 