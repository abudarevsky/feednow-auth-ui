import { Toaster } from '@/components/ui/sonner'
import { Home } from '@/routes/home'

export default function App() {
  return (
    <>
      <Home />
      {/* One global toast outlet for the whole app (Phase 02, Sonner). */}
      <Toaster />
    </>
  )
}
