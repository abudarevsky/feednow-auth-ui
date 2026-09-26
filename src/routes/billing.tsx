import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function BillingPage() {
  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">FeedNow account</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      </header>
      <Card className="border-emerald-800/15 bg-white">
        <CardHeader><CardTitle>Billing and plans</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <p>Plan, payment, and invoice management will be available here.</p>
          <p className="mt-2">The billing page is available while an organization is suspended. It does not change organization access or suspension status.</p>
        </CardContent>
      </Card>
    </main>
  )
}

export { BillingPage }
