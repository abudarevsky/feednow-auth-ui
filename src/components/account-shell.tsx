import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { createFeedNowApiClient } from '@/api/client'
import { createOrganizationsApi, type Organization } from '@/api/organizations'
import { AccountNav, type AccountNavItem } from '@/components/account-nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/routes/use-session'

type AccountShellProps = {
  items: AccountNavItem[]
  children: ReactNode
}

function AccountShell({ items, children }: AccountShellProps) {
  const session = useSession()
  const organizationsApi = useMemo(() => createOrganizationsApi(createFeedNowApiClient()), [])
  const [suspendedOrganization, setSuspendedOrganization] = useState<Organization>()

  useEffect(() => {
    if (session.status !== 'authenticated') return
    const controller = new AbortController()
    void organizationsApi.list({ limit: 100, signal: controller.signal })
      .then((response) => setSuspendedOrganization(response.data?.items.find((organization) => organization.suspended_at || organization.status !== 'active')))
      .catch(() => { /* Keep the rest of the signed-in account usable during a status lookup outage. */ })
    return () => controller.abort()
  }, [organizationsApi, session.status])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl gap-8 px-5 py-6 sm:px-8">
      <aside className="hidden w-56 shrink-0 border-r border-border pr-4 md:block">
        <AccountNav items={items} />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" aria-label="Open account navigation">
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>Account navigation</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <AccountNav items={items} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <section aria-label="Account content">
          {suspendedOrganization && <div role="status" className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <Badge variant="destructive">Suspended</Badge>
            <p><span className="font-semibold">{suspendedOrganization.name}</span> is suspended. Organization features and API keys are unavailable.</p>
          </div>}
          {children}
        </section>
      </div>
    </div>
  )
}

export { AccountShell }
export type { AccountShellProps }
