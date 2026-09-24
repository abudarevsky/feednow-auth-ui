"use client"

import type { CSSProperties } from 'react'
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const TOAST_AUTO_DISMISS_MS = 5000

const Toaster = ({ className, ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
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

export { Toaster, toast, TOAST_AUTO_DISMISS_MS }
