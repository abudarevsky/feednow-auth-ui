import type { CSSProperties } from 'react'
import { toast, Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

/*
 * shadcn/ui Sonner Toaster (new-york style), the Phase 02 toast primitive
 * enumerated by the specification. Sonner owns the notification system:
 * toasts render inside a dedicated `aria-live="polite"` region (a labelled
 * <section> excluded from normal tab order), each toast is keyboard-focusable
 * (tabIndex 0), dismissible through its named close button, and auto-dismissal
 * is the default lifecycle. Sonner pauses auto-dismissal while a toast is
 * hovered, focused within, or the document is hidden, so timed dismissals
 * never pull content out from under an interacting user.
 *
 * Deviations from raw CLI output, recorded like ui/button.tsx and
 * ui/dialog.tsx:
 * - The theme comes from this repo's ThemeProvider (useTheme) instead of a
 *   `next-themes` import or `theme="system"`: Sonner's own palette then
 *   follows the same explicit light/dark choice that drives the `.dark`
 *   class, so an OS-dark browser can never silently swap toast colors, and
 *   callers can still override via props.
 * - `closeButton` is enabled so dismissal is an explicit, labelled control
 *   ("Close toast"), not a color-only or gesture-only affordance.
 * - The default auto-dismiss window is set explicitly to
 *   TOAST_AUTO_DISMISS_MS instead of relying on Sonner's internal 4000 ms
 *   default, so the contract is visible and testable; per-toast `duration`
 *   still wins.
 * - `cn` uses the repo alias @/lib/utils and className is merged instead of
 *   overwritten, matching the other ui/ components.
 * - `toast` is re-exported so app code imports the toast API from this module
 *   (one place owns the system's configuration) rather than from 'sonner'
 *   directly.
 */

/** Default time a toast stays visible before auto-dismissal. */
const TOAST_AUTO_DISMISS_MS = 5000

function Toaster({ className, ...props }: ToasterProps) {
  const { theme } = useTheme()
  return (
    <SonnerToaster
      theme={theme}
      closeButton
      duration={TOAST_AUTO_DISMISS_MS}
      className={cn('toaster group', className)}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

// The generated shadcn API exports the component; `toast` and the duration
// constant are the system's call sites and test contract. The rule is
// suppressed narrowly instead of disabling it repo-wide.
// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast, TOAST_AUTO_DISMISS_MS }
