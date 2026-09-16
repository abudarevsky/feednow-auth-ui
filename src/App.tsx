import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/hooks/use-theme'
import { Home } from '@/routes/home'

export default function App() {
  return (
    <ThemeProvider>
      {/* Global chrome: one theme toggle, fixed so it stays reachable on
          every screen. The provider owns the `.dark` class and persistence. */}
      <div className="fixed top-md right-md z-50">
        <ThemeToggle />
      </div>
      <Home />
      {/* One global toast outlet for the whole app (Phase 02, Sonner). */}
      <Toaster />
    </ThemeProvider>
  )
}
