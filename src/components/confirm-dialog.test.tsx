import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '@/components/confirm-dialog'

function renderConfirmDialog() {
  const onConfirm = vi.fn()
  render(
    <ConfirmDialog
      trigger={<button type="button">Revoke key</button>}
      title="Revoke API key?"
      description="This action cannot be undone."
      body={<p>Applications using this key will lose access.</p>}
      confirmLabel="Revoke"
      onConfirm={onConfirm}
    />,
  )
  return { onConfirm, trigger: screen.getByRole('button', { name: 'Revoke key' }) }
}

describe('ConfirmDialog', () => {
  it('opens with cancel focused and confirms exactly once', async () => {
    const { onConfirm } = renderConfirmDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Revoke key' }))

    const cancel = await screen.findByRole('button', { name: 'Cancel' })
    await waitFor(() => expect(document.activeElement).toBe(cancel))
    expect(screen.getByText('Applications using this key will lose access.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('dismisses with Escape without confirming and restores trigger focus', async () => {
    const { onConfirm, trigger } = renderConfirmDialog()
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('dismisses from the backdrop without confirming', async () => {
    const { onConfirm } = renderConfirmDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Revoke key' }))
    await screen.findByRole('alertdialog')
    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]')
    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay!)

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
