"use client"

import type { CSSProperties } from 'react'
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner'

import { cn } from '@/lib/utils'

const TOAST_AUTO_DISMISS_MS = 5000

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      closeButton
      duration={TOAST_AUTO_DISMISS_MS}
      className={cn('toaster group', className)}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast, TOAST_AUTO_DISMISS_MS }
