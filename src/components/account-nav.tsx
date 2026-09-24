import { Button } from '@/components/ui/button'
import { NavLink } from 'react-router-dom'

type AccountNavItem = {
  label: string
  onSelect?: () => void
  active?: boolean
  to?: string
}

type AccountNavProps = {
  items: AccountNavItem[]
  onNavigate?: () => void
}

function AccountNav({ items, onNavigate }: AccountNavProps) {
  return (
    <nav aria-label="Account">
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? (
              <NavLink
                to={item.to}
                end={item.to === '/account'}
                className="inline-flex h-9 w-full items-center rounded-md px-4 text-sm font-medium hover:bg-accent aria-[current=page]:bg-accent"
                onClick={onNavigate}
              >
                {item.label}
              </NavLink>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start aria-[current=page]:bg-accent"
                aria-current={item.active ? 'page' : undefined}
                onClick={() => {
                  item.onSelect?.()
                  onNavigate?.()
                }}
              >
                {item.label}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { AccountNav }
export type { AccountNavItem, AccountNavProps }
