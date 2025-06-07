'use client'

import { useState, KeyboardEvent } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/UI/Button'

interface TagManagerProps {
  tags: string[]
  onChange: (tags: string[]) => void
  className?: string
  maxTags?: number
}

const commonTags = [
  'Work', 'Family', 'Friends', 'Travel', 'Health', 'Exercise',
  'Food', 'Movies', 'Books', 'Music', 'Learning', 'Goals',
  'Memories', 'Thoughts', 'Gratitude', 'Reflection'
]

export function TagManager({ tags, onChange, className, maxTags = 10 }: TagManagerProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = commonTags.filter(tag => 
    !tags.includes(tag.toLowerCase()) && 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 6)

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags
      </label>
      
      {/* Selected Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-purple-600 dark:hover:text-purple-300 touch-target"
              >
                <XMarkIcon className="h-3 w-3" />
                <span className="sr-only">Remove tag</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag Input */}
      {tags.length < maxTags && (
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Add a tag..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                maxLength={20}
              />
              
              {/* Tag Suggestions */}
              {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                    >
                      #{suggestion.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(inputValue)}
              disabled={!inputValue.trim() || tags.includes(inputValue.trim().toLowerCase())}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Add tag</span>
            </Button>
          </div>
        </div>
      )}

      {/* Common Tags Suggestions */}
      {!showSuggestions && tags.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Suggestions:</p>
          <div className="flex flex-wrap gap-1">
            {commonTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                #{tag.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Limit Indicator */}
      {tags.length >= maxTags && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  )
} 