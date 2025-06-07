// Simple service worker for Violette Diary App
const CACHE_NAME = 'violette-diary-v1'
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.svg'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        // Don't fail installation if caching fails
        return cache.addAll(STATIC_CACHE).catch((error) => {
          console.warn('Failed to cache some assets:', error)
        })
      })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event with network-first strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle manifest.json specifically to prevent 401 errors
  if (event.request.url.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If fetch fails or returns error, try cache
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response
        })
        .catch(() => {
          // Return cached version or basic manifest
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return a basic manifest as fallback
            return new Response(JSON.stringify({
              name: 'Diary App',
              short_name: 'Diary',
              display: 'standalone',
              start_url: '/',
              theme_color: '#8b67ef',
              background_color: '#ffffff'
            }), {
              headers: { 'Content-Type': 'application/manifest+json' }
            })
          })
        })
    )
    return
  }

  // Network-first strategy for other requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response
        }
        
        // Clone response for caching
        const responseClone = response.clone()
        
        // Cache successful GET requests
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch((error) => {
              console.warn('Failed to cache response:', error)
            })
          })
        }
        
        return response
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // For navigation requests, return offline page or basic response
          if (event.request.mode === 'navigate') {
            return new Response('App is offline', {
              headers: { 'Content-Type': 'text/html' }
            })
          }
          
          // For other requests, return error response
          return new Response('Network error', { status: 408 })
        })
      })
  )
}) 