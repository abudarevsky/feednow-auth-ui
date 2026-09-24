import { Button } from '@/components/ui/button'

type AccountNavItem = {
  label: string
  onSelect: () => void
  active?: boolean
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
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start aria-[current=page]:bg-accent"
              aria-current={item.active ? 'page' : undefined}
              onClick={() => {
                item.onSelect()
                onNavigate?.()
              }}
            >
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { AccountNav }
export type { AccountNavItem, AccountNavProps }
