import { AccountShell } from '@/components/account-shell'
import { AuthCard } from '@/components/auth-card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormField } from '@/components/form-field'
import { EmptyState, ErrorState, LoadingBlock } from '@/components/state-blocks'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

/** Temporary visual surface for Phase 02 primitives; routing replaces it in Phase 03. */
export function Home() {
  return (
    <div>
      <header className="mx-auto max-w-6xl px-6 pt-8">
        <h1 className="text-3xl font-semibold">Phase 02 design system</h1>
        <p className="mt-2 text-muted-foreground">Temporary primitives gallery.</p>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 p-6">
        <section aria-labelledby="theme-swatches">
          <h2 id="theme-swatches" className="mb-3 text-xl font-semibold">Theme swatches</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background p-4 text-foreground">Surface and primary text</div>
            <div className="rounded-md bg-primary p-4 text-primary-foreground">Primary action</div>
            <div className="rounded-md bg-destructive p-4 text-destructive-foreground">Destructive state</div>
          </div>
        </section>

        <section aria-labelledby="form-pattern">
          <h2 id="form-pattern" className="mb-3 text-xl font-semibold">Form field pattern</h2>
          <div className="max-w-md">
            <FormField id="gallery-email" label="Email address" type="email" hint="Use your work email." error="Enter a valid email address." />
          </div>
        </section>

        <section aria-labelledby="auth-card-preview">
          <h2 id="auth-card-preview" className="text-xl font-semibold">Auth card</h2>
          <AuthCard title="Account access" description="A content-sized card for authentication screens." footer={<Button variant="outline">Continue</Button>}>
            <FormField id="gallery-password" label="Password" type="password" />
          </AuthCard>
        </section>

        <section aria-labelledby="account-shell-preview">
          <h2 id="account-shell-preview" className="text-xl font-semibold">Account shell</h2>
          <AccountShell
            items={[
              { label: 'Profile', active: true, onSelect: () => undefined },
              { label: 'Security', onSelect: () => undefined },
            ]}
          >
            <h2 className="text-xl font-semibold">Profile settings</h2>
            <p className="mt-2 text-muted-foreground">Responsive account content area.</p>
          </AccountShell>
        </section>

        <section aria-labelledby="feedback-primitives">
          <h2 id="feedback-primitives" className="mb-3 text-xl font-semibold">Feedback and confirmation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-3">
              <Badge>Active</Badge>
              <Alert>
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>Your profile changes are ready.</AlertDescription>
              </Alert>
              <ConfirmDialog
                trigger={<Button variant="destructive">Revoke key</Button>}
                title="Revoke this key?"
                description="Applications using this key will lose access."
                onConfirm={() => undefined}
              />
            </div>
            <div className="grid gap-4">
              <LoadingBlock />
              <EmptyState title="No sessions" description="New sessions appear here." />
              <ErrorState message="Could not load account details." />
              <Skeleton aria-hidden="true" className="h-5 w-2/3" />
            </div>
          </div>
        </section>

        <section aria-labelledby="dialog-preview">
          <h2 id="dialog-preview" className="mb-3 text-xl font-semibold">Dialog</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog preview</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog preview</DialogTitle>
              <DialogDescription>Keyboard focus stays inside this dialog until it closes.</DialogDescription>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  )
}
