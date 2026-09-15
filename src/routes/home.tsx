/**
 * Placeholder home route for the Phase 01 scaffold.
 *
 * Real routing arrives in Phase 03 (React Router layouts and account routes);
 * this component exists so the static build renders one minimal route from
 * `src/routes/` per the agreed source layout.
 */
export function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">feednow-auth-ui</h1>
      <p className="text-sm text-neutral-600">
        Static React scaffold placeholder.
      </p>
    </main>
  )
}
