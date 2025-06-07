'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store'
import { TabNavigation } from '@/components/Navigation/TabNavigation'
import { ToastContainer } from '@/components/UI/Toast'
import { Button } from '@/components/UI/Button'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const { diary } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Create entries map by date for quick lookup
  const entriesByDate = new Map<string, number>()
  diary.recentEntries.forEach(entry => {
    const dateKey = new Date(entry.createdAt).toDateString()
    entriesByDate.set(dateKey, (entriesByDate.get(dateKey) || 0) + 1)
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null)
  }

  const selectDate = (day: number) => {
    const selected = new Date(year, month, day)
    setSelectedDate(selected)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const getSelectedDateEntries = () => {
    if (!selectedDate) return []
    const selectedDateString = selectedDate.toDateString()
    return diary.recentEntries.filter(entry => 
      new Date(entry.createdAt).toDateString() === selectedDateString
    )
  }

  const selectedEntries = getSelectedDateEntries()

  // Generate calendar days
  const calendarDays = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Calendar
            </h1>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Calendar Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {MONTHS[month]} {year}
            </h2>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="h-10" />
                }

                const dayDate = new Date(year, month, day)
                const isToday = dayDate.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === dayDate.toDateString()
                const entryCount = entriesByDate.get(dayDate.toDateString()) || 0
                const hasEntries = entryCount > 0

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`
                      relative h-10 text-sm font-medium rounded-md transition-colors
                      ${isSelected
                        ? 'bg-purple-500 text-white'
                        : isToday
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {day}
                    {hasEntries && (
                      <div className={`
                        absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full
                        ${isSelected ? 'bg-white' : 'bg-purple-500'}
                      `} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Entries */}
        {selectedDate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(selectedDate, 'long')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>

            {selectedEntries.length > 0 ? (
              <div className="p-4 space-y-4">
                {selectedEntries.map(entry => (
                  <div key={entry.id} className="border-l-4 border-purple-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(entry.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {entry.mood && (
                        <span className="text-lg">
                          {entry.mood === 'happy' && '😊'}
                          {entry.mood === 'sad' && '😢'}
                          {entry.mood === 'tired' && '😴'}
                          {entry.mood === 'loved' && '😍'}
                          {entry.mood === 'angry' && '😤'}
                          {entry.mood === 'anxious' && '😰'}
                          {entry.mood === 'thoughtful' && '🤔'}
                          {entry.mood === 'excited' && '🎉'}
                          {entry.mood === 'peaceful' && '😌'}
                          {entry.mood === 'down' && '😔'}
                          {entry.mood === 'grateful' && '🤗'}
                          {entry.mood === 'confident' && '😎'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {entry.content.length > 150 
                        ? `${entry.content.substring(0, 150)}...`
                        : entry.content
                      }
                    </p>

                    {entry.photos.length > 0 && (
                      <div className="flex space-x-2 mb-2">
                        {entry.photos.slice(0, 3).map((photo, index) => (
                          <Image
                            key={index}
                            src={photo}
                            alt={`Entry photo ${index + 1}`}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ))}
                        {entry.photos.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{entry.photos.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{entry.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mb-4">
                  <div className="mx-auto h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  No entries for this date
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
} 