function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** Placeholder shared by administrative screens while their server data streams. */
type SkeletonVariant = "dashboard" | "collection" | "portfolio" | "analysis" | "form";

export function PageSkeleton({ variant = "portfolio" }: { variant?: SkeletonVariant }) {
  const metrics = variant === "analysis" ? 5 : variant === "dashboard" || variant === "collection" ? 3 : 0;
  const hasForm = variant === "form" || variant === "collection" || variant === "analysis";
  return (
    <div aria-busy="true" aria-label="Cargando contenido" role="status">
      <div className="rounded-3xl px-2 pb-5">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-3 h-9 w-56 max-w-[80%]" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      </div>

      {hasForm ? <div className="mt-7 rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><SkeletonBlock className="h-4 w-36" /><div className="mt-5 grid gap-4 sm:grid-cols-3"><SkeletonBlock className="h-11 w-full" /><SkeletonBlock className="h-11 w-full" /><SkeletonBlock className="h-11 w-full" /></div></div> : null}

      {metrics > 0 ? <div className={`mt-7 grid gap-5 ${variant === "analysis" ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-3"}`}>
        {Array.from({ length: metrics }, (_, index) => `metric-${index}`).map((key) => (
          <div className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]" key={key}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-4 h-8 w-36" />
          </div>
        ))}
      </div> : null}

      <div className="mt-7 overflow-hidden rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]">
        <SkeletonBlock className="h-4 w-40" />
        <div className="mt-6 space-y-5">
          {["row-1", "row-2", "row-3", "row-4"].map((key) => (
            <div className="flex items-center justify-between gap-8" key={key}>
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-4 w-1/5" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando información…</span>
    </div>
  );
}
