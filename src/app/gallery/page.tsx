'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store'
import { SideNavigation } from '@/components/Navigation/SideNavigation'
import { ToastContainer } from '@/components/UI/Toast'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, Bars3Icon, SparklesIcon, HashtagIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { formatDate, formatTime } from '@/lib/utils'

type FilterType = 'all' | 'photos' | 'mood' | 'location'

export default function GalleryPage() {
  const { diary, ui, setMenuOpen } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let entries = [...diary.recentEntries]

    // Apply filters
    if (filterType === 'photos') {
      entries = entries.filter(entry => entry.photos.length > 0)
    } else if (filterType === 'mood' && selectedMood) {
      entries = entries.filter(entry => entry.mood === selectedMood)
    } else if (filterType === 'location') {
      entries = entries.filter(entry => entry.location)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      entries = entries.filter(entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (entry.location?.address?.toLowerCase().includes(query)) ||
        (entry.location?.city?.toLowerCase().includes(query))
      )
    }

    return entries.sort((a, b) => b.createdAt - a.createdAt)
  }, [diary.recentEntries, filterType, selectedMood, searchQuery])

  const selectedEntryData = selectedEntry 
    ? diary.recentEntries.find(e => e.id === selectedEntry)
    : null

  const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'loved', emoji: '😍', label: 'Loved' },
    { value: 'angry', emoji: '😤', label: 'Angry' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
    { value: 'excited', emoji: '🎉', label: 'Excited' },
    { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
    { value: 'down', emoji: '😔', label: 'Down' },
    { value: 'grateful', emoji: '🤗', label: 'Grateful' },
    { value: 'confident', emoji: '😎', label: 'Confident' },
  ]

  const clearFilters = () => {
    setFilterType('all')
    setSelectedMood('')
    setSearchQuery('')
    setShowFilters(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(254, 252, 247)' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setMenuOpen(!ui.isMenuOpen)}
                className="p-2 transition-colors rounded-lg hover:bg-purple-50"
                style={{ color: '#C9A0DC' }}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                Gallery
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries, tags, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>

              {/* Filter Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Show
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All entries' },
                    { value: 'photos', label: 'With photos' },
                    { value: 'mood', label: 'By mood' },
                    { value: 'location', label: 'With location' },
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterType(filter.value as FilterType)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        filterType === filter.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Filter */}
              {filterType === 'mood' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Mood
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {moods.map(mood => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(mood.value === selectedMood ? '' : mood.value)}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                          selectedMood === mood.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg mb-1">{mood.emoji}</span>
                        <span className="text-xs">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Gallery Grid */}
        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEntry(entry.id)}
              >
                {/* Photos */}
                {entry.photos.length > 0 && (
                  <div className="relative">
                    <Image
                      src={entry.photos[0]}
                      alt="Entry photo"
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    {entry.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        +{entry.photos.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
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
                        {moods.find(m => m.value === entry.mood)?.emoji}
                      </span>
                    )}
                  </div>

                  {/* Text Content */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {entry.content.length > 120 
                      ? `${entry.content.substring(0, 120)}...`
                      : entry.content
                    }
                  </p>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* AI Analysis Badge */}
                  {entry.aiAnalysis && (
                    <div className="mb-2">
                      <div className="flex items-center space-x-1 text-xs">
                        <SparklesIcon className="h-3 w-3 text-purple-500" />
                        <span className="text-purple-600 font-medium">AI Analyzed</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {entry.aiAnalysis.confidence > 0.8 ? '99%' : 
                           entry.aiAnalysis.confidence > 0.6 ? '85%' : '70%'} confident
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {entry.aiAnalysis.description.length > 80 
                          ? `${entry.aiAnalysis.description.substring(0, 80)}...`
                          : entry.aiAnalysis.description
                        }
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  {entry.location && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {entry.location.address || entry.location.city || 'Unknown location'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterType !== 'all' ? 'No matching entries' : 'No entries yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start writing in your diary to see your entries here'
              }
            </p>
            {(searchQuery || filterType !== 'all') && (
              <Button onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Entry Detail Modal */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        size="lg"
        title={selectedEntryData ? formatDate(selectedEntryData.createdAt, 'long') : ''}
      >
        {selectedEntryData && (
          <div className="space-y-4">
            {/* Photos */}
            {selectedEntryData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedEntryData.photos.map((photo, index) => (
                  <Image
                    key={index}
                    src={photo}
                    alt={`Entry photo ${index + 1}`}
                    width={200}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedEntryData.content}
              </p>
            </div>

            {/* Mood */}
            {selectedEntryData.mood && (
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {moods.find(m => m.value === selectedEntryData.mood)?.emoji}
                </span>
                <span className="text-sm text-gray-600">
                  Feeling {moods.find(m => m.value === selectedEntryData.mood)?.label.toLowerCase()}
                </span>
              </div>
            )}

            {/* Tags */}
            {selectedEntryData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedEntryData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Location */}
            {selectedEntryData.location && (
              <div className="text-sm text-gray-500 flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedEntryData.location.address || selectedEntryData.location.city || 'Unknown location'}
              </div>
            )}

            {/* AI Analysis */}
            {selectedEntryData.aiAnalysis && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center space-x-2 mb-3">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">AI Analysis</h3>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                    {Math.round(selectedEntryData.aiAnalysis.confidence * 100)}% confident
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedEntryData.aiAnalysis.description}
                    </p>
                  </div>

                  {/* Sentiment */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Sentiment</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedEntryData.aiAnalysis.sentiment > 0.6 ? 'bg-green-500' :
                            selectedEntryData.aiAnalysis.sentiment > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(10, selectedEntryData.aiAnalysis.sentiment * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {selectedEntryData.aiAnalysis.sentiment > 0.6 ? 'Positive' :
                         selectedEntryData.aiAnalysis.sentiment > 0.3 ? 'Neutral' : 'Negative'}
                      </span>
                    </div>
                  </div>

                  {/* Themes */}
                  {selectedEntryData.aiAnalysis.themes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Themes</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntryData.aiAnalysis.themes.map((theme, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Generated Tags */}
                  {selectedEntryData.aiAnalysis.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">AI Suggested Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEntryData.aiAnalysis.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                          >
                            <HashtagIcon className="h-2.5 w-2.5 mr-0.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Merkle Root */}
                  {selectedEntryData.aiAnalysis.merkleRoot && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <BeakerIcon className="h-4 w-4 mr-1" />
                        Merkle Root
                      </h4>
                      <code className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded break-all">
                        {selectedEntryData.aiAnalysis.merkleRoot}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-200">
              Created on {formatDate(selectedEntryData.createdAt, 'long')} at {formatTime(selectedEntryData.createdAt)}
            </div>
          </div>
        )}
      </Modal>

      {/* Side Navigation */}
      <SideNavigation 
        isOpen={ui.isMenuOpen} 
        onClose={() => setMenuOpen(false)} 
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
} 