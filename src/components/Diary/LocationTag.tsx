'use client'

import { useEffect } from 'react'
import { MapPinIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { useToast } from '@/components/UI/Toast'
import { LocationData } from '@/types'

interface LocationTagProps {
  location?: LocationData
  enabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export function LocationTag({ location, enabled, onToggle, className }: LocationTagProps) {
  const { 
    location: locationState, 
    setLocationEnabled, 
    setCurrentLocation,
    setLocationPermission 
  } = useAppStore()
  
  const toast = useToast()

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now()
      }

      // Try to get readable address using reverse geocoding
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.latitude}&longitude=${locationData.longitude}&localityLanguage=en`
        )
        
        if (response.ok) {
          const data = await response.json()
          locationData.address = data.locality || data.city || data.principalSubdivision
          locationData.city = data.city
          locationData.country = data.countryName
        }
      } catch (geoError) {
        console.log('Reverse geocoding failed, using coordinates only')
      }

      setCurrentLocation(locationData)
      setLocationPermission(true)
      toast.success('Location updated')
      
    } catch (error) {
      console.error('Location error:', error)
      setLocationPermission(false)
      
      if ((error as GeolocationPositionError).code === 1) {
        toast.error('Location permission denied')
      } else if ((error as GeolocationPositionError).code === 2) {
        toast.error('Location unavailable')
      } else {
        toast.error('Failed to get location')
      }
    }
  }

  const toggleLocation = async () => {
    if (!enabled) {
      setLocationEnabled(true)
      onToggle(true)
      
      if (!locationState.currentLocation) {
        await requestLocation()
      }
    } else {
      setLocationEnabled(false)
      onToggle(false)
      setCurrentLocation(null)
    }
  }

  // Auto-request location if enabled but no current location
  useEffect(() => {
    if (enabled && !locationState.currentLocation && locationState.hasPermission !== false) {
      requestLocation()
    }
  }, [enabled, locationState.currentLocation, locationState.hasPermission])

  const displayLocation = location || locationState.currentLocation
  const displayText = displayLocation?.address || 
                     displayLocation?.city || 
                     (displayLocation ? `${displayLocation.latitude.toFixed(4)}, ${displayLocation.longitude.toFixed(4)}` : 'Location unavailable')

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </span>
          {enabled && displayLocation && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {displayText}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleLocation}
        className={`
          flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors touch-target
          ${
            enabled
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
      >
        {enabled ? (
          <>
            <MapPinIcon className="h-4 w-4" />
            <span>On</span>
          </>
        ) : (
          <>
            <EyeSlashIcon className="h-4 w-4" />
            <span>Off</span>
          </>
        )}
      </button>
    </div>
  )
} 