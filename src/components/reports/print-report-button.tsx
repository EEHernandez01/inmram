"use client";

export function PrintReportButton() {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-card border border-border bg-surface px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-bg"
      onClick={() => window.print()}
      type="button"
    >
      Imprimir
    </button>
  );
}
