'use client'

import { Fragment, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Transition } from '@headlessui/react'
import { 
  HomeIcon, 
  CalendarIcon, 
  PhotoIcon, 
  CogIcon,
  XMarkIcon,
  UserIcon,
  HeartIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  PhotoIcon as PhotoIconSolid,
  CogIcon as CogIconSolid,
  LinkIcon as LinkIconSolid
} from '@heroicons/react/24/solid'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  description?: string
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    description: 'Your diary entries'
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: CalendarIcon,
    activeIcon: CalendarIconSolid,
    description: 'View entries by date'
  },
  {
    href: '/gallery',
    label: 'Gallery',
    icon: PhotoIcon,
    activeIcon: PhotoIconSolid,
    description: 'Browse photos and memories'
  },
  {
    href: '/cross-chain',
    label: 'Cross-Chain Verification',
    icon: LinkIcon,
    activeIcon: LinkIconSolid,
    description: 'NFT ownership verification'
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: CogIcon,
    activeIcon: CogIconSolid,
    description: 'App preferences'
  },
]

interface SideNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  const pathname = usePathname()

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      </Transition>

      {/* Side Menu */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="ease-in duration-200"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full violette-avatar flex items-center justify-center">
                                      <Image
                      src="/violette-avatar.png"
                      alt="Violette Avatar"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full"
                    />
                </div>
                <div>
                  <Image
                    src="/violette-logo.svg"
                    alt="Violette"
                    width={40}
                    height={16}
                    className="violette-logo-small"
                  />
                  <p className="text-sm text-gray-500">
                    Personal Diary
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  const Icon = isActive ? item.activeIcon : item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 group',
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                      )}
                    >
                      <Icon className={cn(
                        'h-6 w-6 transition-colors',
                        isActive 
                          ? 'text-purple-600' 
                          : 'text-gray-500 group-hover:text-purple-600'
                      )} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <HeartIcon className="h-4 w-4 text-red-500" />
                <span>Made with love for your memories</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Version 1.0.0
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </>
  )
} 