'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CameraIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { Button } from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import { vibrate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CameraCaptureProps {
  onPhotoCapture?: (photoDataUrl: string) => void
  onClose?: () => void
  className?: string
}

export function CameraCapture({ onPhotoCapture, onClose, className }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mountedRef = useRef(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    camera, 
    setCameraActive, 
    setCameraPermission, 
    setCapturedPhoto, 
    setCameraStream 
  } = useAppStore()
  
  const toast = useToast()

  // Stable function references using useRef
  const stopCameraRef = useRef<() => void>()
  const startCameraRef = useRef<() => Promise<void>>()

  stopCameraRef.current = () => {
    try {
      if (camera.stream) {
        camera.stream.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (error) {
            console.warn('Error stopping camera track:', error)
          }
        })
        setCameraStream(null)
      }
      setCameraActive(false)
    } catch (error) {
      console.warn('Error stopping camera:', error)
    }
  }

  startCameraRef.current = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading || !mountedRef.current) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported')
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Check if component is still mounted
      if (videoRef.current && mountedRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.warn('Video play failed:', playError)
        }
      }
      
      // Only update state if component is still mounted
      if (videoRef.current && mountedRef.current) {
        setCameraStream(stream)
        setCameraPermission(true)
        setCameraActive(true)
      } else {
        // Component unmounted, clean up stream
        stream.getTracks().forEach(track => track.stop())
      }
      
    } catch (err) {
      console.error('Camera access error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed'
      
      // Only update error state if component is still mounted
      if (mountedRef.current) {
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
          setError('Camera permission denied. Please allow camera access and try again.')
          setCameraPermission(false)
          toast.error('Camera permission required')
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
          setError('No camera found on this device.')
          toast.error('No camera available')
        } else if (errorMessage.includes('not supported')) {
          setError('Camera not supported on this device.')
          toast.error('Camera not supported')
        } else {
          setError('Failed to access camera. Please try again.')
          toast.error('Camera error')
        }
      }
    } finally {
      // Only update loading state if component is still mounted
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Stable wrapper functions
  const stopCamera = useCallback(() => {
    stopCameraRef.current?.()
  }, [])

  const startCamera = useCallback(async () => {
    await startCameraRef.current?.()
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // Vibrate for feedback
    vibrate(50)
    
    setCapturedPhoto(photoDataUrl)
    
    // Stop camera immediately after capturing photo
    stopCamera()
    
    if (onPhotoCapture) {
      onPhotoCapture(photoDataUrl)
    }
    
    toast.success('Photo captured!')
  }, [setCapturedPhoto, onPhotoCapture, toast, stopCamera])

  const switchCamera = useCallback(async () => {
    if (!mountedRef.current || isLoading) return
    
    // Stop current camera
    stopCameraRef.current?.()
    
    // Change facing mode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // Wait a bit for cleanup, then restart with new facing mode
    setTimeout(() => {
      if (mountedRef.current) {
        startCameraRef.current?.()
      }
    }, 200)
  }, [facingMode, isLoading])

  const handleClose = useCallback(() => {
    stopCamera()
    if (onClose) {
      onClose()
    }
  }, [stopCamera, onClose])

  // Initialize camera on mount
  useEffect(() => {
    mountedRef.current = true
    
    const initCamera = async () => {
      if (mountedRef.current) {
        await startCamera()
      }
    }
    
    initCamera()
    
    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [startCamera, stopCamera]) // Include dependencies

  // No automatic restart - handled manually in switchCamera function

  // Handle visibility change to manage camera resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!mountedRef.current) return
      
      // Only stop camera when hidden, don't auto-restart
      if (document.hidden) {
        stopCameraRef.current?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // No dependencies - just manage visibility

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-6 text-center", className)}>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
        <div className="space-y-3">
          <Button onClick={startCamera} loading={isLoading}>
            Try Again
          </Button>
          {onClose && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative h-full w-full bg-black", className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Starting camera...</p>
          </div>
        </div>
      )}
      
      {/* Camera Controls */}
      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          {/* Close Button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close camera</span>
            </Button>
          )}
          
          {/* Capture Button */}
          <Button
            onClick={capturePhoto}
            disabled={!camera.isActive || isLoading}
            className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 text-gray-900 shadow-lg"
          >
            <CameraIcon className="h-8 w-8" />
            <span className="sr-only">Take photo</span>
          </Button>
          
          {/* Switch Camera Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            disabled={!camera.isActive || isLoading}
            className="text-white hover:bg-white/20"
          >
            <ArrowPathIcon className="h-6 w-6" />
            <span className="sr-only">Switch camera</span>
          </Button>
        </div>
      </div>
      
      {/* Camera Status Indicator */}
      {camera.isActive && (
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">REC</span>
        </div>
      )}
    </div>
  )
} 