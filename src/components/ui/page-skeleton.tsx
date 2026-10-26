import type { ReactNode } from "react";

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

type SkeletonVariant =
  | "dashboard"
  | "collection"
  | "portfolio"
  | "contracts"
  | "analysis"
  | "form"
  | "water"
  | "inflation"
  | "unit"
  | "detail";

function LoadingRegion({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true" className="space-y-6" role="status">
      {children}
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}

function Header({ action = false }: { action?: boolean }) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-bg px-2 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-2xl">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-2 h-10 w-64 max-w-[85%]" />
        <SkeletonBlock className="mt-3 h-5 w-full max-w-xl" />
      </div>
      {action ? <SkeletonBlock className="h-12 w-48 rounded-xl" /> : null}
    </header>
  );
}

function Fields({ count, columns = "sm:grid-cols-2" }: { count: number; columns?: string }) {
  return (
    <div className={`grid gap-5 ${columns}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="mt-2 h-12 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function Metrics({ count, columns = "sm:grid-cols-3" }: { count: number; columns?: string }) {
  return (
    <section className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }, (_, index) => (
        <div className="min-h-28 rounded-2xl border border-border bg-surface p-5" key={index}>
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mt-3 h-8 w-40 max-w-full" />
          <SkeletonBlock className="mt-2 h-4 w-32" />
        </div>
      ))}
    </section>
  );
}

function Table({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))` };
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid gap-5 border-b border-border bg-bg px-5 py-4" style={grid}>
        {Array.from({ length: columns }, (_, index) => <SkeletonBlock className="h-4 w-4/5" key={index} />)}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <div className="grid min-h-14 items-center gap-5 px-5 py-4" key={row} style={grid}>
            {Array.from({ length: columns }, (_, column) => <SkeletonBlock className={`h-5 ${column === 0 ? "w-full" : "w-3/4"}`} key={column} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Filter({ count = 3, columns = "sm:grid-cols-3" }: { count?: number; columns?: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <Fields columns={columns} count={count} />
      <SkeletonBlock className="mt-5 h-12 w-32 rounded-xl" />
    </section>
  );
}

function ReceiptList() {
  return (
    <section className="space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <article className="overflow-hidden rounded-2xl border border-border bg-surface" key={index}>
          <div className="flex min-h-24 items-center justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-6 w-3/4 max-w-lg" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SkeletonBlock className="h-5 w-44 max-w-full" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <SkeletonBlock className="ml-auto h-5 w-28" />
              <SkeletonBlock className="ml-auto mt-2 h-7 w-36" />
              <SkeletonBlock className="ml-auto mt-2 h-4 w-32" />
            </div>
          </div>
          {index === 0 ? (
            <div className="border-t border-border p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-3">
                <div><SkeletonBlock className="h-5 w-48" /><SkeletonBlock className="mt-3 h-5 w-40" /></div>
                <div><SkeletonBlock className="h-5 w-36" /><SkeletonBlock className="mt-3 h-5 w-32" /></div>
                <div className="rounded-xl border border-border bg-bg p-4"><SkeletonBlock className="h-5 w-40" /><div className="mt-4 grid grid-cols-3 gap-3">{Array.from({ length: 3 }, (_, item) => <SkeletonBlock className="h-8 w-full" key={item} />)}</div></div>
              </div>
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-11 w-44 rounded-lg" /><SkeletonBlock className="h-11 w-48 rounded-lg" /><SkeletonBlock className="h-11 w-44 rounded-lg" /></div>
                <div className="mt-5 rounded-xl border border-border bg-bg p-5">
                  <SkeletonBlock className="h-7 w-64 max-w-full" />
                  <SkeletonBlock className="mt-2 h-5 w-56 max-w-full" />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, field) => <div key={field}><SkeletonBlock className="h-5 w-28" /><SkeletonBlock className="mt-2 h-12 w-full rounded-lg" /></div>)}</div>
                  <SkeletonBlock className="mt-4 h-12 w-40 rounded-xl" />
                </div>
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <LoadingRegion>
      <Header action />
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><SkeletonBlock className="h-5 w-36" /><SkeletonBlock className="mt-2 h-8 w-56 max-w-full" /><SkeletonBlock className="mt-2 h-5 w-48" /></div>
          <SkeletonBlock className="h-5 w-24" />
        </div>
        <SkeletonBlock className="mt-5 h-4 w-full rounded-full" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div className="min-h-28 rounded-xl border border-border bg-bg p-4" key={index}><SkeletonBlock className="h-5 w-28" /><SkeletonBlock className="mt-3 h-8 w-40 max-w-full" /><SkeletonBlock className="mt-2 h-4 w-36 max-w-full" /></div>)}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-hidden="true">
        <SkeletonBlock className="h-4 w-28" /><SkeletonBlock className="mt-2 h-8 w-48" />
        <div className="mt-4 divide-y divide-border">
          {Array.from({ length: 3 }, (_, index) => <div className="flex min-h-20 items-center justify-between gap-4 py-4" key={index}><div className="min-w-0 flex-1"><SkeletonBlock className="h-5 w-56 max-w-full" /><SkeletonBlock className="mt-2 h-4 w-72 max-w-full" /></div><div className="shrink-0"><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="mt-2 h-4 w-24" /></div></div>)}
        </div>
      </section>
      <section aria-hidden="true"><SkeletonBlock className="h-8 w-56" /><div className="mt-4 grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div className="min-h-32 rounded-2xl border border-border bg-surface p-5" key={index}><SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="mt-3 h-9 w-48" /><SkeletonBlock className="mt-2 h-5 w-56 max-w-full" /></div>)}</div></section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]" aria-hidden="true"><div><SkeletonBlock className="h-8 w-56" /><SkeletonBlock className="mt-3 h-5 w-72 max-w-full" /><div className="mt-4 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div className="rounded-2xl border border-border bg-surface p-5" key={index}><SkeletonBlock className="h-6 w-40" /><SkeletonBlock className="mt-3 h-5 w-56 max-w-full" /><SkeletonBlock className="mt-6 h-11 w-36 rounded-xl" /></div>)}</div></div><div><SkeletonBlock className="h-8 w-56" /><SkeletonBlock className="mt-3 h-5 w-full" /><div className="mt-4 space-y-3">{Array.from({ length: 2 }, (_, index) => <SkeletonBlock className="h-20 w-full rounded-xl" key={index} />)}</div></div></section>
    </LoadingRegion>
  );
}

/** Route-specific loading layouts that follow the current page hierarchy. */
export function PageSkeleton({ variant = "portfolio" }: { variant?: SkeletonVariant }) {
  if (variant === "dashboard") return <DashboardSkeleton />;

  if (variant === "collection") {
    return <LoadingRegion><Header action /><Metrics count={5} columns="sm:grid-cols-2 xl:grid-cols-5" /><Filter count={3} columns="sm:grid-cols-2 xl:grid-cols-3" /><ReceiptList /></LoadingRegion>;
  }

  if (variant === "portfolio") {
    return (
      <LoadingRegion>
        <Header action />
        <div className="flex gap-3" aria-hidden="true"><SkeletonBlock className="h-11 w-28 rounded-full" /><SkeletonBlock className="h-11 w-32 rounded-full" /></div>
        <Filter count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
        <section className="grid gap-4 md:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => <article className="overflow-hidden rounded-2xl border border-border bg-surface" key={index}><SkeletonBlock className="h-48 w-full rounded-none" /><div className="p-5"><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="mt-3 h-7 w-3/4" /><SkeletonBlock className="mt-3 h-5 w-48" /><div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3"><SkeletonBlock className="h-10 w-full" /><SkeletonBlock className="h-10 w-full" /><SkeletonBlock className="h-10 w-full" /></div></div></article>)}
        </section>
      </LoadingRegion>
    );
  }

  if (variant === "contracts") {
    return (
      <LoadingRegion>
        <Header />
        <Metrics count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
        <section className="grid gap-3 lg:grid-cols-2" aria-hidden="true">{Array.from({ length: 2 }, (_, index) => <div className="rounded-2xl border border-border bg-warning-soft/50 p-5" key={index}><SkeletonBlock className="h-6 w-3/4" /><SkeletonBlock className="mt-3 h-5 w-48" /></div>)}</section>
        <Filter count={2} columns="sm:grid-cols-[1fr_220px_auto]" />
        <section className="space-y-4" aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <article className="rounded-2xl border border-border bg-surface p-5" key={index}><div className="flex flex-col justify-between gap-5 lg:flex-row"><div className="flex-1"><SkeletonBlock className="h-7 w-3/4" /><SkeletonBlock className="mt-3 h-5 w-48" /></div><div className="grid flex-1 gap-4 sm:grid-cols-3"><SkeletonBlock className="h-12 w-full" /><SkeletonBlock className="h-12 w-full" /><SkeletonBlock className="h-12 w-full" /></div></div></article>)}</section>
      </LoadingRegion>
    );
  }

  if (variant === "analysis") {
    return <LoadingRegion><Header action /><Filter count={1} columns="sm:grid-cols-[1fr_auto]" /><Metrics count={4} columns="sm:grid-cols-2 xl:grid-cols-4" /><section className="space-y-6" aria-hidden="true">{[1, 2].map((key) => <div key={key}><SkeletonBlock className="mb-3 h-7 w-56" /><div className="rounded-2xl border border-border bg-surface p-5"><SkeletonBlock className="h-6 w-72 max-w-full" /><div className="mt-5"><Table columns={5} rows={2} /></div></div></div>)}</section></LoadingRegion>;
  }

  if (variant === "inflation") {
    return <LoadingRegion><Header /><section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(290px,.6fr)]" aria-hidden="true"><div className="rounded-2xl border border-border bg-surface p-6"><SkeletonBlock className="h-8 w-64" /><SkeletonBlock className="mt-4 h-5 w-full" /><div className="mt-5 rounded-xl border border-border p-4"><SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="mt-3 h-5 w-3/4" /></div><div className="mt-5"><Fields count={4} columns="sm:grid-cols-2 lg:grid-cols-4" /></div></div><div className="rounded-2xl border border-border bg-surface p-6"><SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="mt-3 h-7 w-48" /><SkeletonBlock className="mt-3 h-5 w-full" /><SkeletonBlock className="mt-5 h-24 w-full rounded-xl" /><SkeletonBlock className="mt-3 h-24 w-full rounded-xl" /></div></section><section className="rounded-2xl border border-border bg-surface p-6" aria-hidden="true"><SkeletonBlock className="h-8 w-56" /><div className="mt-5"><Metrics count={2} columns="sm:grid-cols-2" /></div></section><Table columns={4} /></LoadingRegion>;
  }

  if (variant === "water") {
    return <LoadingRegion><Header /><Filter count={4} columns="sm:grid-cols-2 xl:grid-cols-4" /><section className="space-y-6" aria-hidden="true">{[1, 2].map((key) => <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6" key={key}><div className="flex flex-wrap justify-between gap-4"><div><SkeletonBlock className="h-6 w-56" /><SkeletonBlock className="mt-2 h-5 w-48" /></div><SkeletonBlock className="h-11 w-32 rounded-xl" /></div><div className="mt-5 border-t border-border pt-5"><Fields count={4} columns="sm:grid-cols-2 xl:grid-cols-4" /></div><div className="mt-5"><Table columns={4} rows={2} /></div></article>)}</section></LoadingRegion>;
  }

  if (variant === "form") {
    return <LoadingRegion><Header action /><section className="max-w-5xl rounded-2xl border border-border bg-surface p-5 sm:p-7" aria-hidden="true"><SkeletonBlock className="h-7 w-56" /><SkeletonBlock className="mt-3 h-5 w-full max-w-2xl" /><div className="mt-6"><Fields count={6} columns="sm:grid-cols-2" /></div><div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"><SkeletonBlock className="h-12 w-32 rounded-xl" /><SkeletonBlock className="h-12 w-40 rounded-xl" /></div></section></LoadingRegion>;
  }

  const isDetail = variant === "detail" || variant === "unit";
  return <LoadingRegion><Header action={isDetail} /><section className="rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-hidden="true"><SkeletonBlock className="h-7 w-56" /><SkeletonBlock className="mt-3 h-5 w-full max-w-2xl" /><div className="mt-6"><Fields count={6} columns="sm:grid-cols-2 xl:grid-cols-3" /></div></section>{isDetail ? <><Metrics count={3} columns="sm:grid-cols-3" /><ReceiptList /></> : null}</LoadingRegion>;
}
