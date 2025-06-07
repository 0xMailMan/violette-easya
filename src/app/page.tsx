'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { TextEntry } from '@/components/Diary/TextEntry'
import { CameraButton } from '@/components/Camera/CameraButton'
import { CameraCapture } from '@/components/Camera/CameraCapture'
import { TabNavigation } from '@/components/Navigation/TabNavigation'
import { Modal } from '@/components/UI/Modal'
import { ToastContainer } from '@/components/UI/Toast'
import { formatDate, formatTime } from '@/lib/utils'

export default function HomePage() {
  const { 
    user, 
    diary, 
    ui, 
    camera,
    setActiveModal,
    setCapturedPhoto,
    completeOnboarding 
  } = useAppStore()

  // Auto-complete onboarding for now (in real app, this would be a proper flow)
  useEffect(() => {
    if (!user.isOnboarded) {
      completeOnboarding()
    }
  }, [user.isOnboarded, completeOnboarding])

  const handleCameraCapture = (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl)
    setActiveModal(null)
  }

  const recentEntries = diary.recentEntries.slice(0, 5) // Show last 5 entries

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              My Diary
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(new Date(), 'long')}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* New Entry Form */}
        <section>
          <TextEntry />
        </section>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Entries
            </h2>
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(entry.createdAt, 'medium')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
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

                  {/* Entry Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...` 
                        : entry.content
                      }
                    </p>
                  </div>

                  {/* Photos */}
                  {entry.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {entry.photos.slice(0, 3).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Entry photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                      {entry.photos.length > 3 && (
                        <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{entry.photos.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Location */}
                  {entry.location && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {entry.location.address || entry.location.city || 'Unknown location'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recentEntries.length === 0 && (
          <section className="text-center py-12">
            <div className="mb-6">
              <div className="mx-auto h-24 w-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Start your diary journey
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Share your thoughts, capture moments with photos, and create lasting memories.
            </p>
          </section>
        )}
      </main>

      {/* Camera Button */}
      <CameraButton />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Camera Modal */}
      <Modal
        isOpen={ui.activeModal === 'camera'}
        onClose={() => setActiveModal(null)}
        size="full"
        showCloseButton={false}
        className="p-0"
      >
        <CameraCapture
          onPhotoCapture={handleCameraCapture}
          onClose={() => setActiveModal(null)}
        />
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}
