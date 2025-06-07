'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import { TabNavigation } from '@/components/Navigation/TabNavigation'
import { ToastContainer, useToast } from '@/components/UI/Toast'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { 
  CogIcon, 
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  MapPinIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user, diary, updatePreferences, deleteEntry } = useAppStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const toast = useToast()

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme })
    toast.success(`Theme changed to ${theme}`)
  }

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    updatePreferences({ fontSize })
    toast.success(`Font size changed to ${fontSize}`)
  }

  const handleLocationToggle = () => {
    const newLocationEnabled = !user.preferences.locationEnabled
    updatePreferences({ locationEnabled: newLocationEnabled })
    toast.success(`Location ${newLocationEnabled ? 'enabled' : 'disabled'}`)
  }

  const handleAutoSaveToggle = () => {
    const newAutoSave = !user.preferences.autoSave
    updatePreferences({ autoSave: newAutoSave })
    toast.success(`Auto-save ${newAutoSave ? 'enabled' : 'disabled'}`)
  }

  const handleExport = (format: 'json' | 'pdf' | 'txt') => {
    try {
      let content = ''
      let filename = `diary-export-${new Date().toISOString().split('T')[0]}`
      let mimeType = ''

      if (format === 'json') {
        content = JSON.stringify({
          metadata: {
            exportDate: new Date().toISOString(),
            totalEntries: diary.recentEntries.length,
            appVersion: '1.0.0'
          },
          entries: diary.recentEntries
        }, null, 2)
        filename += '.json'
        mimeType = 'application/json'
      } else if (format === 'txt') {
        content = diary.recentEntries
          .sort((a, b) => a.createdAt - b.createdAt)
          .map(entry => {
            const date = new Date(entry.createdAt).toLocaleString()
            const mood = entry.mood ? ` (${entry.mood})` : ''
            const tags = entry.tags.length > 0 ? `\nTags: ${entry.tags.map(t => `#${t}`).join(', ')}` : ''
            const location = entry.location ? `\nLocation: ${entry.location.address || entry.location.city || 'Unknown'}` : ''
            
            return `${date}${mood}\n${'='.repeat(50)}\n${entry.content}${tags}${location}\n`
          })
          .join('\n')
        filename += '.txt'
        mimeType = 'text/plain'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Diary exported as ${format.toUpperCase()}`)
      setShowExportModal(false)
    } catch {
      toast.error('Failed to export diary')
    }
  }

  const handleDeleteAllEntries = () => {
    diary.recentEntries.forEach(entry => {
      deleteEntry(entry.id)
    })
    setShowDeleteConfirm(false)
    toast.success('All entries deleted')
  }

  const storageUsed = diary.recentEntries.length
  const storageLimit = 1000 // Example limit

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Appearance
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Theme */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', icon: SunIcon, label: 'Light' },
                  { value: 'dark', icon: MoonIcon, label: 'Dark' },
                  { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value as 'light' | 'dark' | 'system')}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                      user.preferences.theme === value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleFontSizeChange(value as 'small' | 'medium' | 'large')}
                    className={`p-2 text-center rounded-lg border transition-colors ${
                      user.preferences.fontSize === value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className={`${
                      value === 'small' ? 'text-sm' : 
                      value === 'medium' ? 'text-base' : 'text-lg'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Toast Testing (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🧪 Toast Testing
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Test the new collapsible error/warning notifications
              </p>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => toast.error('This is a test error message that should be collapsible')}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Test Error
                </Button>
                <Button
                  onClick={() => toast.warning('This is a test warning message that should be collapsible')}
                  variant="outline"
                  size="sm"
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  Test Warning
                </Button>
                <Button
                  onClick={() => toast.success('This is a success message (normal behavior)')}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Test Success
                </Button>
                <Button
                  onClick={() => toast.info('This is an info message (normal behavior)')}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Test Info
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error and warning messages will auto-collapse to small icons after 3 seconds. 
                Success and info messages behave normally (disappear after 5 seconds).
              </p>
            </div>
          </section>
        )}

        {/* Privacy & Data */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Privacy & Data
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Location Services
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add location to diary entries
                  </p>
                </div>
              </div>
              <button
                onClick={handleLocationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.preferences.locationEnabled
                    ? 'bg-purple-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.preferences.locationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CloudArrowUpIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Auto Save
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically save drafts while typing
                  </p>
                </div>
              </div>
              <button
                onClick={handleAutoSaveToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.preferences.autoSave
                    ? 'bg-purple-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Storage */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Storage
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Storage Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Diary Entries
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {storageUsed} / {storageLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Export Data */}
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              className="w-full justify-start"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export Diary Data
            </Button>

            {/* Delete All Data */}
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start"
              disabled={diary.recentEntries.length === 0}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete All Entries
            </Button>
          </div>
        </section>

        {/* About */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              About
            </h2>
          </div>
          
          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Entries</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {diary.recentEntries.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Drafts</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {diary.draftEntries.length}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Diary"
        description="Choose a format to export your diary entries"
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              className="justify-start"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">JSON Format</div>
                <div className="text-xs text-gray-500">Complete data with metadata</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('txt')}
              className="justify-start"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Text Format</div>
                <div className="text-xs text-gray-500">Simple text file, easy to read</div>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete All Entries"
        description="This action cannot be undone. All your diary entries will be permanently deleted."
      >
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAllEntries}
            className="flex-1"
          >
            Delete All
          </Button>
        </div>
      </Modal>

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
} 