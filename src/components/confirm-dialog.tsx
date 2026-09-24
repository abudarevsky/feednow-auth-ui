import { useRef, useState, type ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type ConfirmDialogProps = {
  trigger: ReactNode
  title: string
  description: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
}

function ConfirmDialog({
  trigger,
  title,
  description,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const confirmed = useRef(false)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) confirmed.current = false
        setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        onBackdropPointerDown={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {body}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (confirmed.current) return
              confirmed.current = true
              onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
