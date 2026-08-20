"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Error al mostrar una sección administrativa.", error);
  }, [error]);

  return (
    <section
      aria-labelledby="admin-error-title"
      className="rounded-card border border-danger/30 bg-danger-soft px-6 py-10 text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-danger">
        Error inesperado
      </p>
      <h1
        className="mt-2 font-serif text-2xl font-semibold text-ink"
        id="admin-error-title"
      >
        No fue posible cargar esta sección
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm text-ink-secondary">
        Puedes intentarlo de nuevo. Si el problema continúa, vuelve al panel e
        inténtalo más tarde.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          onClick={reset}
          type="button"
        >
          Intentar de nuevo
        </button>
        <a
          className="rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
          href="/dashboard"
        >
          Ir al panel
        </a>
      </div>
    </section>
  );
}
