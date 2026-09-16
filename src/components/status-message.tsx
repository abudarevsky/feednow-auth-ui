import * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * StatusMessage (Phase 02, step 3): the shared screen-reader status channel
 * for pending/success announcements that later flows reuse (the "brief
 * loading state" and confirmation messages). The live region is always
 * mounted so text changes inside it are announced; role="status" implies
 * aria-live="polite", which is also set explicitly for AT support margins.
 * Text is visually hidden by default (sr-only) because this component exists
 * for announcements; callers who want the same text visible pass
 * `not-sr-only` (plus their own classes) via className.
 */
function StatusMessage({
  children,
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export { StatusMessage }
