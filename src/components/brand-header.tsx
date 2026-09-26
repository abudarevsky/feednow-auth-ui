function BrandHeader() {
  return (
    <header className="border-b border-emerald-800/15 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <a href="/account" aria-label="FeedNow account home" className="inline-flex items-center">
          <img src="/feednow-logo.png" alt="FeedNow" className="h-9 w-48 object-contain object-left" />
        </a>
        <span className="border-l border-emerald-800/20 pl-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
          Account
        </span>
      </div>
    </header>
  )
}

export { BrandHeader }
