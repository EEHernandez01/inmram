import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section
      aria-labelledby="admin-not-found-title"
      className="rounded-card border border-border bg-surface px-6 py-10 text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Error 404
      </p>
      <h1
        className="mt-2 font-serif text-2xl font-semibold text-ink"
        id="admin-not-found-title"
      >
        No encontramos el registro solicitado
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm text-ink-secondary">
        Es posible que se haya eliminado, que no tengas acceso o que la liga ya
        no sea válida.
      </p>
      <Link
        className="mt-6 inline-flex rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
        href="/dashboard"
      >
        Volver al panel
      </Link>
    </section>
  );
}
