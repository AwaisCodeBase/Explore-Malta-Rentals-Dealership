const formShellClass =
  "relative z-10 overflow-hidden rounded-[var(--r-panel)] bg-[var(--surface-card)] p-4 shadow-[inset_0_0_0_1px_var(--line-subtle),var(--elev-5)] sm:p-5 lg:p-6";

const fieldSkeletonClass = "skeleton h-12 rounded-[var(--r-field)]";

const labelSkeletonClass = "skeleton mb-2 h-2.5 w-24 rounded-full";

type BookingSearchFormSkeletonProps = Readonly<{
  tone?: "default" | "hero";
}>;

export function BookingSearchFormSkeleton({
  tone = "default",
}: BookingSearchFormSkeletonProps) {
  const quickFilterClass =
    tone === "hero"
      ? "inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--line-inverse)] bg-white/10 p-1 shadow-[var(--elev-3)] backdrop-blur-md sm:gap-1.5 sm:p-1.5"
      : "inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-card)] p-1 shadow-[var(--elev-2)] sm:gap-1.5 sm:p-1.5";

  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className={`${quickFilterClass} mx-auto`}>
        <div className="skeleton h-9 w-20 rounded-full sm:h-12 sm:w-28" />
        <div className="skeleton h-9 w-20 rounded-full sm:h-12 sm:w-28" />
        <div className="skeleton h-9 w-28 rounded-full sm:h-12 sm:w-32" />
      </div>

      <div className="relative isolate">
        <div className={formShellClass}>
          <div className="flex flex-col gap-5">
            {/* pickup-location band */}
            <div className="skeleton h-24 rounded-[var(--r-card)]" />

            {/* off-site selection cards */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="skeleton h-20 rounded-[var(--r-card)]" />
              <div className="skeleton h-20 rounded-[var(--r-card)]" />
            </div>

            {/* vehicle-type segmented control */}
            <div>
              <div className={labelSkeletonClass} />
              <div className="grid grid-cols-2 gap-1.5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface-sunken)] p-1.5 sm:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`skeleton h-13 flex-1 rounded-[calc(var(--r-card)-0.375rem)] ${
                      i === 4 ? "max-sm:col-span-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* brand field */}
            <div>
              <div className={labelSkeletonClass} />
              <div className={fieldSkeletonClass} />
            </div>

            {/* trip dates + time slots */}
            <div className="grid gap-4 lg:grid-cols-[1.15fr_minmax(0,1fr)] lg:items-start">
              <div>
                <div className={labelSkeletonClass} />
                <div className={fieldSkeletonClass} />
                <div className="skeleton mt-1.5 h-3 w-56 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={labelSkeletonClass} />
                  <div className={fieldSkeletonClass} />
                </div>
                <div>
                  <div className={labelSkeletonClass} />
                  <div className={fieldSkeletonClass} />
                </div>
              </div>
            </div>
          </div>

          {/* summary footer band */}
          <div className="-mx-4 -mb-4 mt-5 border-t border-[var(--line-subtle)] bg-[var(--surface-band)] px-4 py-4 sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="skeleton h-4 w-48 rounded-full" />
                <div className="skeleton h-3 w-64 rounded-full" />
              </div>
              <div className="skeleton h-12 w-[11.5rem] rounded-full sm:h-13 sm:w-[13rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
