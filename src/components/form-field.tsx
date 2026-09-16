import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/*
 * FormField (Phase 02, step 3): one accessible text-input pattern composing
 * the shadcn Label and Input primitives.
 *
 * - Programmatic label association: the Label is always bound to the Input
 *   via htmlFor/id, so the control's accessible name is the label text.
 * - Optional hint: rendered as visible text and referenced through
 *   aria-describedby.
 * - Error: rendered visibly below the control (never color-only — the text
 *   itself carries an explicit "Error:" prefix), announced via role="alert",
 *   and referenced through aria-describedby so screen readers read it when
 *   the input receives focus. The Input's aria-invalid toggles with the
 *   error state, which also drives its border/ring styling.
 * - Required: an explicit indicator — a visible asterisk (aria-hidden, so it
 *   does not pollute the accessible name) paired with sr-only ", required"
 *   text, plus the native `required` attribute on the control.
 *
 * This is presentation only: no validation business rules, no backend error
 * code mapping (Phase 04), and no form submission. Callers pass already-safe
 * strings; raw backend errors must never be handed to `error`.
 *
 * Deviation note: the step-3 breakdown names "shadcn Form/Label/Input".
 * The current shadcn Form is react-hook-form-coupled, and Phase 02 forbids
 * form submission and adds no react-hook-form dependency, so the Form
 * wiring (label association, aria-describedby, aria-invalid, role="alert")
 * is composed directly onto Label/Input with the same contract.
 */
export type FormFieldProps = Omit<
  React.ComponentProps<'input'>,
  // The wiring below is composed from hint/error state; callers must not be
  // able to silently override it via spread props.
  'id' | 'className' | 'aria-invalid' | 'aria-describedby'
> & {
  /** Stable id of the control; also the base for hint/error element ids. */
  id: string
  /** Visible label text, programmatically associated with the control. */
  label: string
  /** Optional visible hint text, referenced by aria-describedby. */
  hint?: string
  /** Caller-supplied safe error message; renders visibly when present. */
  error?: string
  /** Shows the required indicator and sets the native required attribute. */
  required?: boolean
  /** Classes applied to the Input element itself. */
  className?: string
}

function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  // The error leads so assistive tech announces the problem first; the
  // attribute is omitted entirely when there is nothing to describe.
  const describedBy =
    [errorId, hintId].filter((one): one is string => Boolean(one)).join(' ') ||
    undefined

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
            {/* Leading comma keeps the computed accessible name clean:
                "Full name, required". */}
            <span className="sr-only">, required</span>
          </>
        )}
      </Label>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <Input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={className}
        {...inputProps}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-destructive"
        >
          <span>Error: </span>
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
