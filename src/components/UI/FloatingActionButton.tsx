'use client'

import { forwardRef } from 'react'
import { Button, type ButtonProps } from './Button'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  offset?: {
    bottom?: number
    right?: number
    left?: number
  }
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, position = 'bottom-right', offset, children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    }

    const customStyle = offset ? {
      bottom: offset.bottom ? `${offset.bottom}px` : undefined,
      right: offset.right ? `${offset.right}px` : undefined,
      left: offset.left ? `${offset.left}px` : undefined,
    } : {}

    return (
      <Button
        ref={ref}
        size="fab"
        className={cn(
          'fixed z-40 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95',
          positionClasses[position],
          className
        )}
        style={customStyle}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

export { FloatingActionButton } 