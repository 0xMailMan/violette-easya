'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store'
import { TextEntry } from '@/components/Diary/TextEntry'
import { CameraCaptureWithAI } from '@/components/Camera/CameraCaptureWithAI'
import { SideNavigation } from '@/components/Navigation/SideNavigation'
import { Modal } from '@/components/UI/Modal'
import { ToastContainer } from '@/components/UI/Toast'
import { StorageDebugger } from '@/components/Debug/StorageDebugger'
import { AIAnalysisDebugger } from '@/components/Debug/AIAnalysisDebugger'
import { TestAIEntry } from '@/components/Debug/TestAIEntry'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatDate, formatTime } from '@/lib/utils'
import { Bars3Icon, SparklesIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const { 
    user, 
    diary, 
    ui, 
    setActiveModal,
    setCapturedPhoto,
    completeOnboarding,
    setMenuOpen
  } = useAppStore()

  // Auto-complete onboarding for now (in real app, this would be a proper flow)
  useEffect(() => {
    if (!user.isOnboarded) {
      completeOnboarding()
    }
  }, [user.isOnboarded, completeOnboarding])



  const handleMenuToggle = () => {
    setMenuOpen(!ui.isMenuOpen)
  }

  const recentEntries = diary.recentEntries.slice(0, 5) // Show last 5 entries

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(254, 252, 247)' }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100">
          <div className="max-w-lg mx-auto px-8 py-16">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleMenuToggle}
                className="p-2 pl-6 transition-colors rounded-lg hover:bg-purple-50"
                style={{ color: '#C9A0DC' }}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="px-8">
                <Image
                  src="/violette-logo.svg"
                  alt="Violette"
                  width={40}
                  height={20}
                  className="violette-logo"
                />
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto px-4 py-6 pb-80 space-y-6">
          {/* Violette Message - Like messaging app */}
          <section className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full violette-avatar flex items-center justify-center flex-shrink-0">
                <Image
                  src="/violette-avatar.png"
                  alt="Violette Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-xs">
                <p className="text-gray-700 text-sm">
                  What&apos;s on your mind?
                </p>
              </div>
            </div>
          </section>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Entries
              </h2>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(entry.createdAt, 'medium')}
                        </span>
                        <span className="text-xs text-gray-500">
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
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed">
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
                          <Image
                            key={index}
                            src={photo}
                            alt={`Entry photo ${index + 1}`}
                            width={120}
                            height={80}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                        {entry.photos.length > 3 && (
                          <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">
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
                            className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Analysis Preview */}
                    {entry.aiAnalysis && (
                      <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center space-x-1 mb-1">
                          <SparklesIcon className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-medium text-purple-700">AI Analysis</span>
                        </div>
                        <p className="text-xs text-purple-600 leading-relaxed">
                          {entry.aiAnalysis.description.length > 120 
                            ? `${entry.aiAnalysis.description.substring(0, 120)}...`
                            : entry.aiAnalysis.description
                          }
                        </p>
                        {entry.aiAnalysis.merkleRoot && (
                          <div className="mt-1 text-xs text-purple-500">
                            Merkle: {entry.aiAnalysis.merkleRoot.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    {entry.location && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center">
                        <Image
                          src="/violette-location.svg"
                          alt="Location"
                          width={12}
                          height={12}
                          className="h-3 w-3 mr-1"
                        />
                        {entry.location.address || entry.location.city || 'Unknown location'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>

        {/* New Entry Form - Sticky bottom */}
        <section className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-8">
          <div className="max-w-lg mx-auto">
            <TextEntry />
          </div>
        </section>

        {/* Side Navigation */}
        <SideNavigation 
          isOpen={ui.isMenuOpen} 
          onClose={() => setMenuOpen(false)} 
        />

        {/* Camera Modal */}
        <Modal
          isOpen={ui.activeModal === 'camera'}
          onClose={() => setActiveModal(null)}
          size="full"
          showCloseButton={false}
          className="p-0"
        >
          <CameraCaptureWithAI
            onClose={() => setActiveModal(null)}
          />
        </Modal>

        {/* Toast Container */}
        <ToastContainer />
        
        {/* Storage Debugger (development only) */}
        <StorageDebugger />
        
        {/* AI Analysis Debugger (development only) */}
        <AIAnalysisDebugger />
        
        {/* Test AI Entry Button (development only) */}
        <TestAIEntry />
      </div>
    </ErrorBoundary>
  )
}
