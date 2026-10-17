import { Container } from "@/components/ui/container";

export default function SiteLoading() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)]">
      <Container className="pb-24 pt-[calc(var(--site-header-offset)+3rem)] sm:pt-[calc(var(--site-header-offset)+4rem)]">
        <div aria-hidden>
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton mt-5 h-11 max-w-md rounded-[var(--r-field)]" />
          <div className="skeleton mt-4 h-4 max-w-2xl rounded-full" />
          <div className="skeleton mt-2.5 h-4 max-w-xl rounded-full" />
          <div className="skeleton mt-10 h-72 rounded-[var(--r-feature)]" />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="surface-card overflow-hidden p-3">
                <div className="skeleton h-48 rounded-[calc(var(--r-card)-0.25rem)]" />
                <div className="skeleton mt-4 h-5 w-2/3 rounded-full" />
                <div className="skeleton mt-2.5 h-4 w-full rounded-full" />
                <div className="mt-5 flex items-center justify-between">
                  <div className="skeleton h-5 w-20 rounded-full" />
                  <div className="skeleton h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
