function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

type SkeletonVariant = "dashboard" | "collection" | "portfolio" | "contracts" | "analysis" | "form" | "water" | "inflation" | "unit" | "detail";

const cells = (count: number) => Array.from({ length: count }, (_, index) => (
  <div key={index}><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-2 h-10 w-full rounded" /></div>
));

function Header({ action = false }: { action?: boolean }) {
  return <div className="flex flex-col gap-4 rounded-3xl bg-bg px-2 pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="w-full max-w-2xl"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="mt-2 h-9 w-60 max-w-[80%]" /><SkeletonBlock className="mt-3 h-4 w-full max-w-xl" /></div>{action ? <SkeletonBlock className="h-10 w-40 rounded-xl" /> : null}</div>;
}

function Metrics({ count, columns = "sm:grid-cols-3" }: { count: number; columns?: string }) {
  return <section className={`mt-7 grid gap-4 ${columns}`}>{Array.from({ length: count }, (_, index) => <div className="rounded-card border border-border bg-surface p-5" key={index}><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="mt-3 h-7 w-32" /></div>)}</section>;
}

function Table({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(90px, 1fr))` };
  return <div className="overflow-hidden rounded-card border border-border bg-surface"><div className="grid gap-5 border-b border-border px-5 py-3" style={grid}>{Array.from({ length: columns }, (_, index) => <SkeletonBlock className="h-3 w-4/5" key={index} />)}</div><div className="divide-y divide-border">{Array.from({ length: rows }, (_, row) => <div className="grid gap-5 px-5 py-4" key={row} style={grid}>{Array.from({ length: columns }, (_, column) => <SkeletonBlock className={`h-4 ${column === 0 ? "w-full" : "w-3/4"}`} key={column} />)}</div>)}</div></div>;
}

function Filter({ count = 3 }: { count?: number }) { return <section className="mt-7 rounded-card border border-border bg-surface p-5"><div className="grid gap-4 sm:grid-cols-3">{cells(count)}</div></section>; }

/** Placeholders that mirror the cards, forms and tables rendered by each route. */
export function PageSkeleton({ variant = "portfolio" }: { variant?: SkeletonVariant }) {
  if (variant === "dashboard") return <div aria-busy="true" role="status"><Header action /><section className="mt-7 grid gap-5 xl:grid-cols-2"><div className="rounded-3xl bg-brand p-7"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="mt-3 h-8 w-48" /><div className="mt-8 grid grid-cols-2 gap-5">{cells(2)}</div><SkeletonBlock className="mt-6 h-2 w-full rounded-full" /></div><div className="rounded-3xl bg-bg p-7 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="mt-3 h-8 w-44" /><div className="mt-6 space-y-4">{Array.from({ length: 3 }, (_, index) => <SkeletonBlock className="h-12 w-full" key={index} />)}</div></div></section><section className="mt-9"><SkeletonBlock className="h-7 w-48" /><div className="mt-4 grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div className="rounded-2xl border border-border bg-surface p-5" key={index}><SkeletonBlock className="h-6 w-24 rounded-full" /><SkeletonBlock className="mt-5 h-8 w-12" /><SkeletonBlock className="mt-3 h-5 w-3/5" /></div>)}</div></section></div>;

  if (variant === "collection") return <div aria-busy="true" role="status"><Header action /><Metrics count={5} columns="sm:grid-cols-2 xl:grid-cols-5" /><Filter /><section className="mt-7"><Table columns={6} rows={6} /></section></div>;

  if (variant === "portfolio") return <div aria-busy="true" role="status"><Header action /><section className="mt-7"><div className="mb-5 flex justify-between"><SkeletonBlock className="h-4 w-36" /><SkeletonBlock className="h-4 w-56" /></div><div className="space-y-5">{Array.from({ length: 3 }, (_, index) => <div className="grid overflow-hidden rounded-3xl bg-bg shadow-[8px_8px_18px_#c6cdd6,-8px_-8px_18px_#fff] md:grid-cols-[minmax(220px,30%)_1fr]" key={index}><SkeletonBlock className="min-h-52 w-full rounded-none" /><div className="p-5 sm:p-6"><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-3 h-7 w-3/5" /><SkeletonBlock className="mt-3 h-4 w-36" /><div className="mt-6 grid gap-4 border-y border-border py-4 sm:grid-cols-3">{cells(3)}</div><SkeletonBlock className="mt-4 h-4 w-48" /></div></div>)}</div></section></div>;

  if (variant === "contracts") return <div aria-busy="true" role="status"><Header /><section className="mt-7 space-y-3"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="h-12 w-full rounded-card" /><SkeletonBlock className="h-12 w-full rounded-card" /></section><section className="mt-7"><Table /></section></div>;

  if (variant === "analysis") return <div aria-busy="true" role="status"><Header action /><Filter count={2} /><Metrics count={5} columns="sm:grid-cols-2 xl:grid-cols-5" /><section className="mt-7 space-y-6">{[1, 2].map((key) => <div key={key}><div className="mb-3 flex justify-between"><SkeletonBlock className="h-4 w-48" /><SkeletonBlock className="h-4 w-36" /></div><Table columns={7} rows={3} /></div>)}</section></div>;

  if (variant === "inflation") return <div aria-busy="true" role="status"><Header /><section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(290px,.6fr)]"><div className="rounded-card border border-border bg-surface p-6"><SkeletonBlock className="h-8 w-64" /><SkeletonBlock className="mt-4 h-4 w-full" /><div className="mt-5 rounded-xl border border-border p-4"><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="mt-3 h-4 w-3/4" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cells(4)}</div></div><div className="rounded-card border border-border bg-surface p-6"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="mt-3 h-6 w-44" /><SkeletonBlock className="mt-3 h-4 w-full" /><SkeletonBlock className="mt-5 h-20 w-full rounded-xl" /><SkeletonBlock className="mt-3 h-20 w-full rounded-xl" /></div></section><section className="mt-7 rounded-card border border-border bg-surface p-6"><SkeletonBlock className="h-8 w-52" /><Metrics count={2} columns="sm:grid-cols-2" /></section><section className="mt-7"><Table columns={4} /></section></div>;

  if (variant === "water") return <div aria-busy="true" role="status"><Header /><Filter count={4} /><section className="mt-7 space-y-6">{[1, 2].map((key) => <div className="rounded-card border border-border bg-surface p-5" key={key}><div className="flex justify-between"><div><SkeletonBlock className="h-4 w-56" /><SkeletonBlock className="mt-2 h-3 w-48" /></div><SkeletonBlock className="h-4 w-24" /></div><div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-4">{cells(4)}</div><div className="mt-5"><Table columns={4} rows={2} /></div></div>)}</section></div>;

  const isDetail = variant === "detail" || variant === "unit";
  return <div aria-busy="true" role="status"><Header action={isDetail} /><section className="mt-7 max-w-4xl rounded-card border border-border bg-surface p-5 sm:p-6"><SkeletonBlock className="h-6 w-48" /><SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" /><div className="mt-6 grid gap-4 sm:grid-cols-2">{cells(6)}</div></section>{isDetail ? <section className="mt-7"><Table columns={4} rows={4} /></section> : null}<span className="sr-only">Cargando contenido…</span></div>;
}
