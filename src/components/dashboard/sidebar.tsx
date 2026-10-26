"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RolUsuario } from "@/generated/prisma/enums";

type IconName = "home" | "building" | "file" | "wallet" | "chart" | "user" | "team" | "history";

const groups: { label?: string; items: { href: string; label: string; icon: IconName; roles?: readonly RolUsuario[] }[] }[] = [
  { items: [{ href: "/dashboard", label: "Inicio", icon: "home" }] },
  {
    label: "Gestión de rentas",
    items: [
      { href: "/cobranza", label: "Cobranza", icon: "wallet", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/propiedades", label: "Propiedades", icon: "building", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/contratos", label: "Contratos", icon: "file", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
    ],
  },
  {
    label: "Informes",
    items: [
      { href: "/reportes", label: "Ingresos y gastos", icon: "chart", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/inflacion", label: "Aumentos de renta", icon: "chart", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR] },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/configuracion/usuarios", label: "Usuarios", icon: "team", roles: [RolUsuario.ADMINISTRADOR] },
      { href: "/configuracion/propietarios", label: "Propietarios", icon: "team", roles: [RolUsuario.ADMINISTRADOR] },
      { href: "/configuracion/auditoria", label: "Historial de cambios", icon: "history", roles: [RolUsuario.ADMINISTRADOR] },
    ],
  },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 14h.01"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 3 2 5-7"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    team: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0-1.5-5.6M16 14.5a6 6 0 0 1 5 5.5"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  };
  return <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function Navigation({ role, onNavigate }: { role: RolUsuario; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Navegación principal" className="space-y-5">
    {groups.map((group) => <div key={group.label ?? "inicio"}>
      {group.label ? <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.1em] text-ink-secondary">{group.label}</p> : null}
      <div className="space-y-1">{group.items.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return <Link aria-current={active ? "page" : undefined} className={active ? "nav-item nav-item-active" : "nav-item"} href={item.href} key={item.href} onClick={onNavigate}><Icon name={item.icon}/><span>{item.label}</span></Link>;
      })}</div>
    </div>)}
  </nav>;
}

function MobileNavigation({ alias, email, name, role }: { alias?: string | null; email: string; name: string; role: RolUsuario }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg px-5 py-3 lg:hidden">
      <Link className="brand-lockup" href="/dashboard">
        <span aria-hidden="true" className="brand-mark">R</span>
        <span>INMOBILIARIA RAMOS</span>
      </Link>
      <button
        aria-controls="mobile-primary-navigation"
        aria-expanded={isOpen}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        {isOpen ? "Cerrar" : "Menú"}
      </button>
      <div id="mobile-primary-navigation" className={isOpen ? "absolute inset-x-0 top-full max-h-[calc(100dvh_-_4rem)] overflow-y-auto border-b border-border bg-bg px-5 py-5 shadow-md" : "hidden"}>
          <Navigation role={role} onNavigate={() => setIsOpen(false)} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-secondary">{alias || email}</p>
            </div>
            <SignOutButton />
          </div>
      </div>
    </header>
  );
}

export function Sidebar({ alias, email, name, role }: { alias?: string | null; email: string; name: string; role: RolUsuario }) {
  return (
    <>
      <MobileNavigation alias={alias} email={email} name={name} role={role} />
      <aside className="fixed inset-y-0 left-0 hidden w-[272px] flex-col bg-bg px-5 py-6 lg:top-[76px] lg:flex">
        <div className="flex-1 overflow-y-auto"><Navigation role={role} /></div>
        <div className="mt-5 border-t border-border pt-4">
          <details className="group relative">
            <summary className="account-menu-trigger nav-item cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-inherit">{name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-secondary">{alias || email}</span>
              </span>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-secondary transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </summary>
            <div className="absolute inset-x-0 bottom-full z-20 mb-2 rounded-xl border border-border bg-surface p-2 shadow-md">
              <Link className="nav-item w-full" href="/configuracion/perfil" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>
                <Icon name="user" />
                <span>Mi perfil</span>
              </Link>
              <div className="my-2 border-t border-border" />
              <SignOutButton className="w-full justify-start gap-3 text-left" />
            </div>
          </details>
        </div>
      </aside>
    </>
  );
}
