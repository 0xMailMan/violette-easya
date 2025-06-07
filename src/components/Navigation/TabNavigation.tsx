'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  HomeIcon, 
  CalendarIcon, 
  PhotoIcon, 
  CogIcon 
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  PhotoIcon as PhotoIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface TabItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
}

const tabs: TabItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: CalendarIcon,
    activeIcon: CalendarIconSolid,
  },
  {
    href: '/gallery',
    label: 'Gallery',
    icon: PhotoIcon,
    activeIcon: PhotoIconSolid,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: CogIcon,
    activeIcon: CogIconSolid,
  },
]

export function TabNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-inset">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = isActive ? tab.activeIcon : tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs font-medium transition-colors duration-200 touch-target',
                isActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 