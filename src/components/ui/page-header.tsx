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
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium text-ink-secondary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

