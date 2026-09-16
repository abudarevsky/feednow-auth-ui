import { render, screen } from '@testing-library/react'

import { describe, expect, it } from 'vitest'

import { FormField } from '@/components/form-field'

/*
 * FormField (Phase 02, step 3). These tests pin the accessibility contract
 * the breakdown verifies: the label is associated with the control, the
 * error is referenced by aria-describedby and announced via role="alert",
 * aria-invalid toggles with the error state, and keyboard focus reaches the
 * input. Error text is visible and prefixed ("Error: …") so the invalid
 * state is never conveyed by color alone.
 */
describe('FormField label association', () => {
  it('binds the label to the control via htmlFor/id', () => {
    render(<FormField id="email" label="Email" type="email" />)
    const input = screen.getByLabelText('Email')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('id', 'email')
    const label = document.querySelector('label[for="email"]')
    expect(label).not.toBeNull()
    expect(label).toHaveTextContent('Email')
  })

  it('lets keyboard focus reach the input', () => {
    render(<FormField id="email" label="Email" />)
    const input = screen.getByLabelText('Email')
    expect(input).not.toHaveAttribute('tabindex', '-1')
    input.focus()
    expect(document.activeElement).toBe(input)
  })
})

describe('FormField hint', () => {
  it('renders hint text visibly and references it via aria-describedby', () => {
    render(<FormField id="pw" label="Password" hint="At least 12 characters" />)
    const hint = screen.getByText('At least 12 characters')
    expect(hint.tagName).toBe('P')
    expect(hint).toHaveAttribute('id', 'pw-hint')
    expect(hint).not.toHaveClass('sr-only')
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-describedby',
      'pw-hint'
    )
  })

  it('omits aria-describedby when there is no hint or error', () => {
    render(<FormField id="pw" label="Password" />)
    expect(screen.getByLabelText('Password')).not.toHaveAttribute(
      'aria-describedby'
    )
  })
})

describe('FormField error state', () => {
  it('renders the error visibly, announces it, and wires the control', () => {
    render(<FormField id="code" label="Code" error="Enter a valid code" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('id', 'code-error')
    // Visible text with an explicit prefix: state is never color-only.
    expect(alert).not.toHaveClass('sr-only')
    expect(alert).toHaveTextContent(/^Error: Enter a valid code$/)
    const input = screen.getByLabelText('Code')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'code-error')
  })

  it('lists the error before the hint in aria-describedby', () => {
    render(
      <FormField
        id="code"
        label="Code"
        hint="Six digits"
        error="Enter a valid code"
      />
    )
    expect(screen.getByLabelText('Code')).toHaveAttribute(
      'aria-describedby',
      'code-error code-hint'
    )
  })

  it('toggles aria-invalid, the alert, and describedby off when cleared', () => {
    const { rerender } = render(
      <FormField id="email" label="Email" error="Required" />
    )
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    rerender(<FormField id="email" label="Email" />)
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('FormField required indicator', () => {
  it('exposes an explicit visible and screen-reader indicator', () => {
    render(<FormField id="name" label="Full name" required />)
    const input = screen.getByRole('textbox', { name: 'Full name, required' })
    expect(input).toBeRequired()
    const label = document.querySelector('label[for="name"]')
    expect(label).not.toBeNull()
    // Visible asterisk glyph (not color-only) plus sr-only wording.
    expect(label).toHaveTextContent('*')
    expect(label?.querySelector('span[aria-hidden="true"]')).not.toBeNull()
    expect(label?.querySelector('span.sr-only')).toHaveTextContent(', required')
  })

  it('omits the indicator and native attribute when not required', () => {
    render(<FormField id="name" label="Full name" />)
    const input = screen.getByLabelText('Full name')
    expect(input).not.toBeRequired()
    const label = document.querySelector('label[for="name"]')
    expect(label?.textContent).toBe('Full name')
  })
})

describe('FormField input pass-through', () => {
  it('spreads native input props and merges className onto the control', () => {
    render(
      <FormField
        id="search"
        label="Search"
        autoComplete="off"
        maxLength={40}
        disabled
        className="mt-2"
      />
    )
    const input = screen.getByLabelText('Search')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('maxlength', '40')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('mt-2')
  })
})
