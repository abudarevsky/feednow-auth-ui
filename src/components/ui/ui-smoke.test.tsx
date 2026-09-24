import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

describe('shadcn component smoke test', () => {
  it('renders the button variants and opens a dialog', () => {
    render(
      <>
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog smoke test</DialogTitle>
            <DialogDescription>Dialog content is available.</DialogDescription>
          </DialogContent>
        </Dialog>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outline' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Destructive' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Dialog smoke test')
  })
})
