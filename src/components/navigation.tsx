import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/*
 * Navigation (Phase 02): presentational navigation bar with an optional
 * accessible dropdown menu section.
 *
 * ARIA contract:
 * - Landmark: a single <nav aria-label={label}> names the region, so
 *   screen-reader landmark navigation can distinguish it from any other
 *   navigation on the page.
 * - The item list keeps list semantics through an explicit role="list"
 *   because Tailwind preflight strips <ul> defaults; items live in
 *   listitem elements.
 * - Items are buttons, not links (Phase 02 rule: no routes yet). The active
 *   item exposes aria-current="page"; the emerald fill is decoration, never
 *   the only carrier of that state.
 * - The dropdown trigger is a button whose aria-haspopup="menu",
 *   aria-expanded, and aria-controls wiring, the role="menu"/"menuitem"
 *   semantics, the trigger-labelled menu name, roving arrow-key focus,
 *   typeahead, Escape dismissal, and focus restoration to the trigger are
 *   all owned by the Radix primitive (see ui/dropdown-menu.tsx).
 * - The chevron is aria-hidden decoration; the trigger's accessible name is
 *   its visible label.
 *
 * Presentation only: nav items and menu items come from props and report
 * selection through onSelect. No routing, no session or client data
 * (Phases 03/06/09).
 */

/** A top-level navigation item rendered as a button in the bar. */
export type NavigationItem = {
  id: string
  label: string
  onSelect: () => void
  /** Marks the current page; rendered as aria-current="page". */
  active?: boolean
}

/** One entry inside the navigation dropdown menu. */
export type NavigationMenuItem = {
  id: string
  label: string
  onSelect: () => void
  disabled?: boolean
}

/** The dropdown section: the trigger's visible label plus its menu items. */
export type NavigationMenu = {
  label: string
  items: NavigationMenuItem[]
}

export type NavigationProps = {
  /** Accessible name of the navigation landmark. */
  label: string
  /** Top-level items, rendered in order as buttons. */
  items: NavigationItem[]
  /** Optional dropdown menu rendered as the final element of the bar. */
  menu?: NavigationMenu
  className?: string
}

const navItemClass =
  'inline-flex cursor-default items-center gap-2xs rounded-md px-sm py-xs text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground'

function Navigation({ label, items, menu, className }: NavigationProps) {
  return (
    <nav
      aria-label={label}
      data-slot="navigation"
      className={cn('flex items-center', className)}
    >
      <ul role="list" className="flex items-center gap-xs">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={item.active ? 'page' : undefined}
              onClick={item.onSelect}
              className={navItemClass}
            >
              {item.label}
            </button>
          </li>
        ))}
        {menu && menu.items.length > 0 && (
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    navItemClass,
                    'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
                  )}
                >
                  {menu.label}
                  <svg
                    aria-hidden="true"
                    className="size-3.5 shrink-0 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {menu.items.map((menuItem) => (
                  <DropdownMenuItem
                    key={menuItem.id}
                    disabled={menuItem.disabled}
                    onSelect={menuItem.onSelect}
                  >
                    {menuItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )}
      </ul>
    </nav>
  )
}

export { Navigation }
