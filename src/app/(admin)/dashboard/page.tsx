import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser } from "@/lib/auth/authorization";
import { formatCurrency, formatPercent } from "@/lib/format";
import { obtenerReporteRentabilidad } from "@/lib/services/reports";

import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ session, user }, profitability] = await Promise.all([getSystemUser(), obtenerReporteRentabilidad(undefined, true)]);

  return (
    <>
      <PageHeader
        action={
          <form action={signOut}>
            <button
              className="rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
              type="submit"
            >
              Cerrar sesión
            </button>
          </form>
        }
        description="Consulta lo importante y continúa con las tareas pendientes de tu portafolio."
        eyebrow="Resumen del portafolio"
        title={`Bienvenido, ${user.perfil?.nombreCompleto || session.user.name || session.user.email}`}
      />

      <section className="mt-7 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-secondary">Renta mensual vigente</p><p className="mt-3 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyRent)}</p></div>
        <div className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-secondary">Ingreso neto proyectado</p><p className="mt-3 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyNetIncome)}</p></div>
        <div className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-secondary">Rentabilidad anual</p><p className="mt-3 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{profitability.portfolio.annualReturn === null ? "N/D" : formatPercent(profitability.portfolio.annualReturn)}</p></div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-ink">Accesos rápidos</h2><p className="text-sm text-ink-secondary">Acciones más frecuentes</p></div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Link className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff] transition-transform hover:-translate-y-1" href="/cobranza"><span className="inline-flex rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white">Operación</span><h2 className="mt-5 text-base font-bold text-ink">Revisar cobranza</h2><p className="mt-2 text-sm leading-6 text-ink-secondary">Consulta recibos, registra pagos y atiende vencimientos.</p></Link>
          <Link className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff] transition-transform hover:-translate-y-1" href="/propiedades"><span className="inline-flex rounded-xl bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">Portafolio</span><h2 className="mt-5 text-base font-bold text-ink">Gestionar propiedades</h2><p className="mt-2 text-sm leading-6 text-ink-secondary">Consulta predios, unidades rentables y contratos asociados.</p></Link>
          <Link className="rounded-2xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff] transition-transform hover:-translate-y-1" href="/reportes"><span className="inline-flex rounded-xl bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">Análisis</span><h2 className="mt-5 text-base font-bold text-ink">Ver rentabilidad</h2><p className="mt-2 text-sm leading-6 text-ink-secondary">Compara ingresos, gastos prorrateados y rendimiento por unidad.</p></Link>
        </div>
      </section>
    </>
  );
}
