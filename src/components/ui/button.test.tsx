import { render, screen } from '@testing-library/react'

import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'

/*
 * Foundational Button (Phase 02, step 2). The Button is the shadcn/ui
 * generated primitive; the `default` variant is the FeedNow primary action
 * (white on --primary, the emerald-700 pair asserted in
 * src/test/theme-contrast.test.ts). These tests pin the variant/size class
 * contract, the accessibility behavior (visible focus indicator, native
 * disabled state, aria-invalid wiring, link semantics via asChild), and the
 * absence of `dark:` classes — dark mode flips the semantic variables under
 * the `.dark` class in src/index.css instead, so no usage site needs one.
 */
describe('Button variants', () => {
  it('renders a native button exposing its accessible name', () => {
    render(<Button>Sign in</Button>)
    const button = screen.getByRole('button', { name: 'Sign in' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('data-variant', 'default')
    expect(button).toHaveAttribute('data-size', 'default')
  })

  it('styles the default variant as the primary action', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button', { name: 'Primary' })
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it.each([
    ['secondary', 'bg-secondary', 'text-secondary-foreground'],
    ['destructive', 'bg-destructive', 'text-destructive-foreground'],
    ['outline', 'border', 'bg-background'],
    ['ghost', 'hover:bg-accent', 'hover:text-accent-foreground'],
    ['link', 'text-primary', 'hover:underline'],
  ] as const)('applies the %s variant classes', (variant, ...classes) => {
    render(<Button variant={variant}>Label</Button>)
    const button = screen.getByRole('button', { name: 'Label' })
    expect(button).toHaveAttribute('data-variant', variant)
    expect(button).toHaveClass(...classes)
    // Variant styling is exclusive: no other variant surface leaks in.
    expect(button).not.toHaveClass('bg-primary')
  })

  it('merges caller className last so explicit overrides win', () => {
    render(<Button className="bg-secondary">Custom</Button>)
    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button).toHaveClass('bg-secondary')
    expect(button).not.toHaveClass('bg-primary')
  })
})

describe('Button sizes', () => {
  it.each([
    ['default', 'h-9'],
    ['sm', 'h-8'],
    ['lg', 'h-10'],
    ['icon', 'size-9'],
  ] as const)('applies the %s size classes', (size, heightClass) => {
    render(<Button size={size}>Label</Button>)
    const button = screen.getByRole('button', { name: 'Label' })
    expect(button).toHaveAttribute('data-size', size)
    expect(button).toHaveClass(heightClass)
  })
})

describe('Button accessibility', () => {
  it('gives every button a visible keyboard focus indicator', () => {
    render(<Button>Focus me</Button>)
    const button = screen.getByRole('button', { name: 'Focus me' })
    // The base layer outline is replaced by the ring utilities so focus is
    // shown by a 3px emerald ring plus the ring-colored border, never by
    // color change alone.
    expect(button).toHaveClass(
      'focus-visible:border-ring',
      'focus-visible:ring-[3px]',
      'focus-visible:ring-ring/50',
    )
    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('renders natively disabled buttons and suppresses pointer styling', () => {
    render(<Button disabled>Blocked</Button>)
    const button = screen.getByRole('button', { name: 'Blocked' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  it('passes aria-invalid through to the element for invalid-field association', () => {
    render(
      <Button aria-invalid type="submit">
        Submit
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toHaveAttribute('aria-invalid', 'true')
    expect(button).toHaveAttribute('type', 'submit')
    // The base string styles the invalid state beyond color alone
    // (border + ring change).
    expect(button).toHaveClass(
      'aria-invalid:border-destructive',
      'aria-invalid:ring-destructive/20',
    )
  })

  it('renders as a link via asChild without nesting a button', () => {
    render(
      <Button asChild>
        <a href="/continue">Continue</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Continue' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/continue')
    expect(link).toHaveAttribute('data-slot', 'button')
    expect(link).toHaveClass('bg-primary', 'text-primary-foreground')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Button dark-mode class strategy', () => {
  it('ships no dark: classes because theme flips ride the semantic variables', () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'ghost',
      'link',
    ] as const
    const { container } = render(
      <>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </>,
    )
    for (const element of Array.from(container.querySelectorAll('button'))) {
      expect(element.className).not.toMatch(/(^|\s)dark:/)
    }
  })
})
