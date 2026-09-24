import type { ReactNode } from 'react'

import { AccountNav, type AccountNavItem } from '@/components/account-nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type AccountShellProps = {
  items: AccountNavItem[]
  children: ReactNode
}

function AccountShell({ items, children }: AccountShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-xl p-lg">
      <aside className="hidden w-56 shrink-0 border-r border-border pr-md md:block">
        <AccountNav items={items} />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-md md:hidden">
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
              <div className="px-md">
                <AccountNav items={items} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <section aria-label="Account content">{children}</section>
      </div>
    </div>
  )
}

export { AccountShell }
export type { AccountShellProps }
