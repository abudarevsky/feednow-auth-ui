import type {
  ComponentPropsWithoutRef,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

/**
 * Reusable typography components (Phase 02).
 *
 * These components own the only sanctioned mapping between semantic text use
 * and the `--text-*` scale declared in src/index.css. Each scale utility class
 * below (text-xs … text-4xl) resolves to exactly one `@theme` token, so size,
 * line-height, and tracking always come as a set. src/test/typography-scale.test.ts
 * parses both files so a class here can never reference a step that the
 * stylesheet does not define. Colors used here are limited to the
 * contrast-tested semantic variables (--foreground, --muted-foreground,
 * --destructive); state is never conveyed by color alone.
 */

/** Heading levels supported by {@link Heading}; maps 1:1 to h1–h6. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/** Scale step and weight applied per heading level. */
const headingClasses: Record<HeadingLevel, string> = {
  1: 'text-3xl font-semibold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium',
  5: 'text-base font-medium',
  6: 'text-sm font-medium',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level; renders the matching h1–h6 tag. Defaults to 2. */
  level?: HeadingLevel
}

/**
 * Semantic heading bound to the typography scale. Callers pick the level for
 * document structure (each screen keeps exactly one level-1 heading); visual
 * size follows from the scale, not from ad-hoc classes.
 */
export function Heading({ level = 2, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as HeadingTag
  return (
    <Tag className={cn(headingClasses[level], className)} {...rest}>
      {children}
    </Tag>
  )
}

/** Semantic text roles for non-heading copy. */
export type TextVariant =
  | 'lead'
  | 'body'
  | 'secondary'
  | 'caption'
  | 'label'
  | 'error'
  | 'code'

/** Scale step, color token, and weight per text variant. */
const textVariantClasses: Record<TextVariant, string> = {
  lead: 'text-lg text-muted-foreground',
  body: 'text-base text-foreground',
  secondary: 'text-sm text-muted-foreground',
  caption: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium text-foreground',
  error: 'text-sm text-destructive',
  code: 'font-mono text-sm text-foreground',
}

/** Default element rendered per variant; overridable via `as`. */
const textVariantDefaults: Record<TextVariant, 'p' | 'span' | 'code'> = {
  lead: 'p',
  body: 'p',
  secondary: 'p',
  caption: 'p',
  label: 'span',
  error: 'p',
  code: 'code',
}

export interface TextProps<T extends ElementType = 'p'> {
  /** Element to render; defaults to the variant's semantic element. */
  as?: T
  /** Text role on the typography scale. Defaults to 'body'. */
  variant?: TextVariant
  className?: string
  children: ReactNode
}

/**
 * Scale-bound body copy, hints, captions, labels, error text, and inline
 * code. Pass `as` when a different semantic element is required (e.g.
 * `as="figcaption"` or `as="div"` inside a label); the visual role stays the
 * same. Error text must additionally be wired to its control via
 * aria-describedby by the form pattern (step 3), never shown by color alone.
 */
export function Text<T extends ElementType = 'p'>({
  as,
  variant = 'body',
  className,
  children,
  ...rest
}: TextProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TextProps<T>>) {
  const Component: ElementType = as ?? textVariantDefaults[variant]
  return (
    <Component className={cn(textVariantClasses[variant], className)} {...rest}>
      {children}
    </Component>
  )
}
