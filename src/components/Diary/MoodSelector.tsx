'use client'

interface MoodOption {
  emoji: string
  label: string
  value: string
}

const moodOptions: MoodOption[] = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😍', label: 'Loved', value: 'loved' },
  { emoji: '😤', label: 'Angry', value: 'angry' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
  { emoji: '🎉', label: 'Excited', value: 'excited' },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😔', label: 'Down', value: 'down' },
  { emoji: '🤗', label: 'Grateful', value: 'grateful' },
  { emoji: '😎', label: 'Confident', value: 'confident' },
]

interface MoodSelectorProps {
  value?: string
  onChange: (mood: string) => void
  className?: string
}

export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        How are you feeling?
      </label>
      
      <div className="grid grid-cols-6 gap-2">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value === value ? '' : mood.value)}
            className={`
              flex flex-col items-center p-2 rounded-lg border transition-all duration-200 touch-target
              ${
                value === mood.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            title={mood.label}
          >
            <span className="text-lg mb-1">{mood.emoji}</span>
            <span className="text-xs text-center leading-tight">{mood.label}</span>
          </button>
        ))}
      </div>
      
      {value && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Feeling {moodOptions.find(m => m.value === value)?.label.toLowerCase()}
        </div>
      )}
    </div>
  )
} 