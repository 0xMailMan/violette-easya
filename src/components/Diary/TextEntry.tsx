'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { PaperAirplaneIcon, CameraIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { Button } from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import { LocationTag } from './LocationTag'
import { MoodSelector } from './MoodSelector'
import { TagManager } from './TagManager'
import { debounce } from '@/lib/utils'
import { DiaryEntryFormData } from '@/types'

interface TextEntryProps {
  onSubmit?: (data: DiaryEntryFormData) => void
  initialData?: Partial<DiaryEntryFormData>
  className?: string
}

export function TextEntry({ onSubmit, initialData, className }: TextEntryProps) {
  const [charCount, setCharCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    createEntry, 
    saveDraft, 
    user,
    camera,
    location,
    setActiveModal 
  } = useAppStore()
  
  const toast = useToast()
  
  const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<DiaryEntryFormData>({
    defaultValues: {
      content: initialData?.content || '',
      mood: initialData?.mood || '',
      tags: initialData?.tags || [],
      photos: initialData?.photos || [],
      location: initialData?.location || undefined,
    }
  })

  const content = watch('content')
  const photos = watch('photos')
  const currentLocation = watch('location')

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  // Debounced auto-save
  const debouncedSave = useMemo(
    () => {
      const saveFunction = (formData: DiaryEntryFormData) => {
        if (user.preferences.autoSave && isDirty) {
          saveDraft(formData)
        }
      }
      return debounce(saveFunction, 2000)
    },
    [saveDraft, user.preferences.autoSave, isDirty]
  )

  // Update character count
  useEffect(() => {
    setCharCount(content?.length || 0)
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  // Auto-save on form changes
  useEffect(() => {
    if (content && content.trim() && user.preferences.autoSave) {
      const formData = {
        content,
        mood: watch('mood'),
        tags: watch('tags'),
        photos,
        location: currentLocation,
      }
      debouncedSave(formData)
    }
  }, [content, photos, currentLocation, debouncedSave, watch, user.preferences.autoSave])

  // Add captured photo to entry
  useEffect(() => {
    if (camera.capturedPhoto && !photos.includes(camera.capturedPhoto)) {
      setValue('photos', [...photos, camera.capturedPhoto], { shouldDirty: true })
      toast.success('Photo added to entry')
    }
  }, [camera.capturedPhoto, photos, setValue, toast])

  // Add current location if enabled
  useEffect(() => {
    if (location.isEnabled && location.currentLocation && !currentLocation) {
      setValue('location', location.currentLocation, { shouldDirty: true })
    }
  }, [location.isEnabled, location.currentLocation, currentLocation, setValue])

  const onFormSubmit = (data: DiaryEntryFormData) => {
    if (!data.content.trim()) {
      toast.warning('Please write something before saving')
      return
    }

    if (onSubmit) {
      onSubmit(data)
    } else {
      createEntry({ ...data, isDraft: false })
      toast.success('Entry saved!')
      reset()
      setIsExpanded(false)
    }
  }

  const handleCameraClick = () => {
    setActiveModal('camera')
  }

  const handleUploadClick = () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result as string
            if (result) {
              setValue('photos', [...photos, result], { shouldDirty: true })
            }
          }
          reader.readAsDataURL(file)
        })
      }
    }
    input.click()
  }

  const removePhoto = (photoIndex: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== photoIndex)
    setValue('photos', updatedPhotos, { shouldDirty: true })
  }

  const handleFocus = () => {
    setIsExpanded(true)
    adjustTextareaHeight()
  }

  const placeholder = isExpanded 
    ? "What's on your mind today? Share your thoughts, experiences, or anything that matters to you..."
    : "start typing..."

  return (
    <div className={`violette-card rounded-lg shadow-sm ${className}`} style={{ padding: '24px' }}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Photo Preview Area */}
        {photos.length > 0 && (
          <div className="p-6 pb-0">
            <div className="relative">
              <div className="grid grid-cols-1 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={photo}
                      alt={`Entry photo ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      preview
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Camera and Location Buttons */}
        <div className="px-8 flex justify-center space-x-16 py-8">
          <div className="flex flex-col items-center h-32">
            <button
              type="button"
              onClick={handleCameraClick}
              className="flex flex-col items-center justify-center violette-button p-4"
            >
              <Image
                src="/violette-camera.svg"
                alt="Camera"
                width={80}
                height={80}
                className="h-16 w-16"
              />
            </button>
            <span className="mt-3 text-xs text-gray-400 text-center opacity-50">take a photo</span>
          </div>
          
          <div className="flex flex-col items-center h-32">
            <button
              type="button"
              className="flex flex-col items-center justify-center violette-button p-4"
            >
              <Image
                src="/violette-location.svg"
                alt="Location"
                width={80}
                height={80}
                className="h-16 w-16"
              />
            </button>
            <span className="mt-3 text-xs text-gray-400 text-center opacity-50">tap to turn off location</span>
          </div>
        </div>

        {/* Upload Button */}
        <div className="px-8 py-6 flex justify-center" style={{ background: 'transparent' }}>
          <button
            type="button"
            onClick={handleUploadClick}
            className="violette-button p-4"
          >
            <Image
              src="/violette-upload.svg"
              alt="Upload"
              width={80}
              height={80}
              className="h-16 w-16"
            />
          </button>
        </div>

        {/* Main Text Area */}
        <div className="px-8 pb-8">
          <div className="relative bg-gray-100 rounded-2xl border border-gray-300 shadow-lg px-8 py-6">
            <textarea
              {...register('content', { 
                required: false,
                onChange: (e) => {
                  setCharCount(e.target.value?.length || 0)
                  adjustTextareaHeight()
                }
              })}
              ref={(e) => {
                register('content').ref(e)
                textareaRef.current = e
              }}
              placeholder={placeholder}
              className="w-full resize-none border-none outline-none text-gray-900 placeholder-gray-500 bg-transparent text-lg"
              rows={isExpanded ? 4 : 3}
              onFocus={handleFocus}
              style={{ minHeight: '80px' }}
            />
            
            {/* Character Count */}
            {isExpanded && (
              <div className="absolute bottom-3 right-8 text-sm text-gray-400">
                {charCount.toLocaleString()} characters
              </div>
            )}
          </div>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
            {/* Mood Selector */}
            <MoodSelector
              value={watch('mood')}
              onChange={(mood) => setValue('mood', mood, { shouldDirty: true })}
            />

            {/* Tag Manager */}
            <TagManager
              tags={watch('tags')}
              onChange={(tags) => setValue('tags', tags, { shouldDirty: true })}
            />

            {/* Location Tag */}
            <LocationTag
              location={currentLocation}
              enabled={location.isEnabled}
              onToggle={(enabled) => {
                if (!enabled) {
                  setValue('location', undefined, { shouldDirty: true })
                }
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!content.trim()}
              className="w-full"
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Save Entry
            </Button>
          </div>
        )}
      </form>
    </div>
  )
} 