'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production and if supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      console.log('Registering service worker...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      console.log('Service Worker registered successfully:', registration)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available, refreshing...')
              window.location.reload()
            }
          })
        }
      })

      // Handle errors
      registration.addEventListener('error', (event) => {
        console.error('Service Worker error:', event)
      })

    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  return null // This component doesn't render anything
}

// Function to detect if app can be installed
export function useInstallPrompt() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('App can be installed')
      e.preventDefault()
      // Store the event so it can be triggered later if needed
      const deferredPrompt = e as BeforeInstallPromptEvent
      
      // Example usage: You could call deferredPrompt.prompt() to show install dialog
      // For now, we just log that the app is installable
      console.log('Install prompt available:', deferredPrompt)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
}

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
} 