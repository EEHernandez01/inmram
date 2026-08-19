import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-10 sm:px-9">
      <section
        aria-labelledby="not-found-title"
        className="w-full rounded-card border border-border bg-surface px-6 py-10 text-center shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Error 404
        </p>
        <h1
          className="mt-2 font-serif text-3xl font-semibold text-ink"
          id="not-found-title"
        >
          Esta página no existe
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-secondary">
          Revisa la dirección o regresa al inicio para continuar.
        </p>
        <Link
          className="mt-6 inline-flex rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          href="/"
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
