import * as React from 'react'
import { Label as LabelPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/*
 * shadcn/ui Label (new-york style), checked in verbatim except: the `cn`
 * import uses the repo alias @/lib/utils, the primitive is imported from the
 * installed `radix-ui` umbrella package, and `dark:` classes are removed
 * (Phase 02 declares no dark-mode variant; see
 * src/components/ui/button.tsx for the rationale).
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Label }
