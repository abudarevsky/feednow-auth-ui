import { render, screen } from '@testing-library/react'

import { describe, expect, it } from 'vitest'

import { Heading, Text } from '@/components/typography'

describe('Heading', () => {
  it('renders an h2 with the 2xl scale step by default', () => {
    render(<Heading>Title</Heading>)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Title')
    expect(heading).toHaveClass('text-2xl', 'font-semibold')
  })

  it.each([
    [1, 'text-3xl'],
    [2, 'text-2xl'],
    [3, 'text-xl'],
    [4, 'text-lg'],
    [5, 'text-base'],
    [6, 'text-sm'],
  ] as const)('level %i renders h%i with the %s scale step', (level, step) => {
    render(<Heading level={level}>Title</Heading>)
    const heading = screen.getByRole('heading', { level })
    expect(heading.tagName.toLowerCase()).toBe(`h${level}`)
    expect(heading).toHaveClass(step)
  })

  it('merges caller className last so explicit overrides win', () => {
    render(
      <Heading level={1} className="text-sm">
        Overridden
      </Heading>,
    )
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-sm')
    expect(heading).not.toHaveClass('text-3xl')
  })

  it('passes through standard heading attributes', () => {
    render(
      <Heading level={3} id="section-title" aria-describedby="hint">
        Section
      </Heading>,
    )
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveAttribute('id', 'section-title')
    expect(heading).toHaveAttribute('aria-describedby', 'hint')
  })
})

describe('Text', () => {
  it('renders a paragraph with the body step by default', () => {
    render(<Text>Body copy</Text>)
    const paragraph = screen.getByText('Body copy')
    expect(paragraph.tagName).toBe('P')
    expect(paragraph).toHaveClass('text-base', 'text-foreground')
  })

  it.each([
    ['lead', 'text-lg'],
    ['body', 'text-base'],
    ['secondary', 'text-sm'],
    ['caption', 'text-xs'],
    ['label', 'text-sm'],
    ['error', 'text-sm'],
    ['code', 'text-sm'],
  ] as const)('variant %s applies the %s scale step', (variant, step) => {
    render(<Text variant={variant}>Sample</Text>)
    expect(screen.getByText('Sample')).toHaveClass(step)
  })

  it('maps variants onto the contrast-tested color tokens', () => {
    render(
      <div>
        <Text variant="secondary" data-testid="secondary">
          Hint
        </Text>
        <Text variant="error" data-testid="error">
          Failed
        </Text>
        <Text variant="code" data-testid="code">
          abc123
        </Text>
      </div>,
    )
    expect(screen.getByTestId('secondary')).toHaveClass('text-muted-foreground')
    expect(screen.getByTestId('error')).toHaveClass('text-destructive')
    expect(screen.getByTestId('code')).toHaveClass('font-mono')
    expect(screen.getByTestId('code').tagName).toBe('CODE')
  })

  it('renders the variant default element and honors the as prop', () => {
    render(
      <div>
        <Text variant="label" data-testid="default-el">
          Name
        </Text>
        <Text as="figcaption" variant="caption" data-testid="custom-el">
          Figure
        </Text>
      </div>,
    )
    expect(screen.getByTestId('default-el').tagName).toBe('SPAN')
    const figure = screen.getByTestId('custom-el')
    expect(figure.tagName).toBe('FIGCAPTION')
    expect(figure).toHaveClass('text-xs')
  })

  it('merges caller className last so explicit overrides win', () => {
    render(
      <Text variant="body" className="text-xs">
        Dense
      </Text>,
    )
    const paragraph = screen.getByText('Dense')
    expect(paragraph).toHaveClass('text-xs')
    expect(paragraph).not.toHaveClass('text-base')
  })
})
