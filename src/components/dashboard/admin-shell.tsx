import { Sidebar } from "@/components/dashboard/sidebar";
import Link from "next/link";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { getSystemUser } from "@/lib/auth/authorization";
import { canManageOperations } from "@/lib/auth/role-policy";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, user } = await getSystemUser();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        alias={user.perfil?.alias}
        email={session.user.email}
        name={user.perfil?.nombreCompleto || session.user.name || session.user.email}
        role={user.rol}
      />
      <header className="fixed inset-x-0 top-0 z-40 hidden h-[76px] grid-cols-[272px_minmax(180px,1fr)_auto] items-center gap-5 border-b border-border bg-bg px-5 shadow-[0_1px_0_rgba(23,58,94,0.02)] lg:grid">
        <Link aria-label="Inmobiliaria Ramos, inicio" className="brand-lockup min-w-0" href="/dashboard">
          <span aria-hidden="true" className="brand-mark">R</span>
          <span className="truncate">INMOBILIARIA RAMOS</span>
        </Link>
        <div className="mx-auto w-full max-w-[480px]"><GlobalSearch /></div>
        <nav aria-label="Acciones frecuentes" className="flex flex-nowrap gap-2">
          <Link className="whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand" href="/cobranza">Ir a cobranza</Link>
          {canManageOperations(user.rol) ? <Link className="whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand" href="/propiedades/nueva">Agregar propiedad</Link> : null}
          <Link className="whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand" href="/propiedades">Ver portafolio</Link>
        </nav>
      </header>
      <div className="lg:pl-[272px] lg:pt-[76px]">
        <main className="mx-auto max-w-[1280px] px-5 py-5 sm:px-9 sm:py-7">
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between lg:hidden">
            <GlobalSearch />
            <nav aria-label="Acciones frecuentes" className="flex flex-wrap gap-2">
              <Link className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand/30 hover:text-brand" href="/cobranza">Ir a cobranza</Link>
              {canManageOperations(user.rol) ? <Link className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand/30 hover:text-brand" href="/propiedades/nueva">Agregar propiedad</Link> : null}
              <Link className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand/30 hover:text-brand" href="/propiedades">Ver portafolio</Link>
            </nav>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
