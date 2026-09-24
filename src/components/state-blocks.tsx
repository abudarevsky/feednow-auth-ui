import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

function LoadingBlock() {
  return (
    <div role="status" className="grid gap-sm" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <Skeleton aria-hidden="true" className="h-5 w-2/3" />
      <Skeleton aria-hidden="true" className="h-4 w-full" />
      <Skeleton aria-hidden="true" className="h-4 w-4/5" />
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
}

function EmptyState({
  title,
  description,
  icon = <CircleHelp aria-hidden="true" className="size-5" />,
}: EmptyStateProps) {
  return (
    <section className="grid justify-items-center gap-xs p-xl text-center">
      <span aria-hidden="true" className="text-muted-foreground">
        {icon}
      </span>
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </section>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive p-md text-destructive">
      {message}
    </div>
  )
}

export { LoadingBlock, EmptyState, ErrorState }
export type { EmptyStateProps }
