import type { ReactNode } from "react";

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-bg px-2 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base leading-7 text-ink-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
