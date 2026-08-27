"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { RolUsuario } from "@/generated/prisma/enums";

type IconName = "home" | "building" | "file" | "wallet" | "chart" | "user" | "team" | "history";

const groups: { label?: string; items: { href: string; label: string; icon: IconName; roles?: readonly RolUsuario[] }[] }[] = [
  { items: [{ href: "/dashboard", label: "Inicio", icon: "home" }] },
  {
    label: "Operación diaria",
    items: [
      { href: "/cobranza", label: "Cobranza", icon: "wallet", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/propiedades", label: "Propiedades", icon: "building", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/contratos", label: "Contratos", icon: "file", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/reportes", label: "Rentabilidad", icon: "chart", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] },
      { href: "/inflacion", label: "Actualización de rentas", icon: "chart", roles: [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR] },
    ],
  },
  {
    label: "Cuenta y sistema",
    items: [
      { href: "/configuracion/perfil", label: "Mi perfil", icon: "user" },
      { href: "/configuracion/usuarios", label: "Usuarios", icon: "team", roles: [RolUsuario.ADMINISTRADOR] },
      { href: "/configuracion/auditoria", label: "Actividad", icon: "history", roles: [RolUsuario.ADMINISTRADOR] },
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

function Navigation({ role }: { role: RolUsuario }) {
  const pathname = usePathname();
  return <nav aria-label="Navegación principal" className="space-y-5">
    {groups.map((group) => <div key={group.label ?? "inicio"}>
      {group.label ? <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-secondary/70">{group.label}</p> : null}
      <div className="space-y-1">{group.items.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return <Link className={active ? "nav-item nav-item-active" : "nav-item"} href={item.href} key={item.href}><Icon name={item.icon}/><span>{item.label}</span></Link>;
      })}</div>
    </div>)}
  </nav>;
}

export function Sidebar({ alias, email, name, role }: { alias?: string | null; email: string; name: string; role: RolUsuario }) {
  return <aside className="fixed inset-y-0 left-0 hidden w-[272px] flex-col bg-bg px-5 py-6 lg:flex"><Link className="brand-lockup" href="/dashboard"><span className="brand-mark">R</span><span>INMOBILIARIA RAMOS-ROSCH</span></Link><div className="mt-10 flex-1 overflow-y-auto"><Navigation role={role} /></div><div className="soft-inset mt-5 flex items-center gap-3 rounded-2xl p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-bold text-ink">{name}</p><p className="mt-0.5 truncate text-[11px] text-ink-secondary">{alias || email}</p></div></div></aside>;
}
