'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline'
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

  const handlePhotoClick = () => {
    setActiveModal('camera')
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
    : "How was your day? Tap to start writing..."

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-4">
        {/* Main Text Area */}
        <div className="relative">
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
            className="w-full resize-none border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent"
            rows={isExpanded ? 6 : 3}
            onFocus={handleFocus}
            style={{ minHeight: '80px' }}
          />
          
          {/* Character Count */}
          {isExpanded && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {charCount.toLocaleString()} characters
            </div>
          )}
        </div>

        {/* Photos Preview */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <Image
                  src={photo}
                  alt={`Entry photo ${index + 1}`}
                  width={120}
                  height={80}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Expanded Options */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            {/* Photo Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePhotoClick}
              className="text-gray-500 hover:text-purple-600"
            >
              <PhotoIcon className="h-5 w-5 mr-1" />
              Photo
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!content.trim()}
            className="min-w-[100px]"
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        {/* Auto-save Indicator */}
        {user.preferences.autoSave && isDirty && content.trim() && (
          <div className="text-xs text-gray-400 text-center">
            Auto-saving draft...
          </div>
        )}
      </form>
    </div>
  )
} 