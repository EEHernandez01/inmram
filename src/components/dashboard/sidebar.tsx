"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/contratos", label: "Contratos" },
  { href: "/cobranza", label: "Cobranza" },
  { href: "/inflacion", label: "Inflación" },
  { href: "/reportes", label: "Rentabilidad" },
  { href: "/agua", label: "Agua" },
  { href: "/configuracion/perfil", label: "Mi perfil" },
  { href: "/configuracion/auditoria", label: "Auditoría" },
] as const;

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="space-y-1">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            className={
              active
                ? "flex items-center rounded bg-brand-soft px-3 py-2.5 text-sm font-medium text-brand"
                : "flex items-center rounded px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-bg hover:text-ink"
            }
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  alias,
  email,
  name,
}: {
  alias?: string | null;
  email: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-5 py-4 lg:hidden">
        <Link className="font-serif text-lg font-semibold text-brand" href="/dashboard">
          Inmobiliaria Ramos
        </Link>
        <button
          aria-expanded={open}
          aria-label="Abrir navegación"
          className="rounded border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-bg"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          Menú
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-30 bg-ink/20 lg:hidden" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-60 border-r border-border bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <p className="font-serif text-lg font-semibold text-brand">Inmobiliaria Ramos</p>
              <button
                aria-label="Cerrar navegación"
                className="rounded px-2 py-1 text-sm text-ink-secondary hover:bg-bg hover:text-ink"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>
            <Navigation onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-surface p-5 lg:flex lg:flex-col">
        <Link className="font-serif text-lg font-semibold text-brand" href="/dashboard">
          Inmobiliaria Ramos
        </Link>
        <div className="mt-9 flex-1">
          <Navigation />
        </div>
        <div className="border-t border-border pt-4">
          <p className="truncate text-xs font-semibold text-ink">{name}</p>
          <p className="mt-1 truncate text-xs text-ink-secondary">{alias || email}</p>
        </div>
      </aside>
    </>
  );
}
