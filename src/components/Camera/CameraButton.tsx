'use client'

import Image from 'next/image'
import { CameraIcon } from '@heroicons/react/24/outline'
import { FloatingActionButton } from '@/components/UI/FloatingActionButton'
import { useAppStore } from '@/store'
import { useToast } from '@/components/UI/Toast'

interface CameraButtonProps {
  onCameraOpen?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  offset?: {
    bottom?: number
    right?: number
    left?: number
  }
}

export function CameraButton({ 
  onCameraOpen, 
  position = 'bottom-right',
  offset 
}: CameraButtonProps) {
  const { setActiveModal } = useAppStore()
  const toast = useToast()

  const handleCameraClick = async () => {
    // Check if camera API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera not supported on this device')
      return
    }

    // Check for existing camera permissions
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      if (permissions.state === 'denied') {
        toast.warning('Camera permission denied. Please enable in browser settings.')
        return
      }
    } catch {
      // Permissions API might not be available, continue anyway
      console.log('Permissions API not available')
    }

    // Open camera modal or trigger callback
    if (onCameraOpen) {
      onCameraOpen()
    } else {
      setActiveModal('camera')
    }
  }

  return (
    <FloatingActionButton
      onClick={handleCameraClick}
      position={position}
      offset={offset}
      className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      aria-label="Open camera"
    >
      <Image
        src="/violette-camera.svg"
        alt="Camera"
        width={28}
        height={28}
        className="h-7 w-7"
      />
    </FloatingActionButton>
  )
} 