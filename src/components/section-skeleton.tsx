export function SectionSkeleton() {
  return (
    <div className="py-20 sm:py-24 lg:py-32" aria-hidden>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton mt-5 h-9 w-[min(100%,28rem)] rounded-[var(--r-field)]" />
        <div className="skeleton mt-4 h-4 w-full max-w-2xl rounded-full" />
        <div className="skeleton mt-2.5 h-4 w-full max-w-xl rounded-full" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card overflow-hidden p-3">
              <div className="skeleton h-44 rounded-[calc(var(--r-card)-0.25rem)]" />
              <div className="skeleton mt-4 h-5 w-2/3 rounded-full" />
              <div className="skeleton mt-2.5 h-4 w-full rounded-full" />
              <div className="skeleton mt-2 h-4 w-4/5 rounded-full" />
              <div className="mt-5 flex items-center justify-between">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-9 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
