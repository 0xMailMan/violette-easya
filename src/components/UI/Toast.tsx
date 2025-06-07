'use client'

import { Fragment, useEffect } from 'react'
import { Transition } from '@headlessui/react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
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

function ToastItem({ 
  message, 
  type = 'info', 
  duration = 5000, 
  action 
}: ToastProps) {
  const hideToast = useAppStore(state => state.hideToast)
  const Icon = toastIcons[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, hideToast])

  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full',
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
      
      <button
        onClick={hideToast}
        className="ml-4 flex-shrink-0 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 touch-target"
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="h-5 w-5" />
      </button>
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
          <ToastItem message={message} type={type} />
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