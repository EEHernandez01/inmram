import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser } from "@/lib/auth/authorization";
import { formatCurrency, formatPercent } from "@/lib/format";
import { obtenerReporteRentabilidad } from "@/lib/services/reports";

import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ session, user }, profitability] = await Promise.all([getSystemUser(), obtenerReporteRentabilidad()]);

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
        description="Administra el portafolio desde la estructura base del sistema."
        eyebrow="Área administrativa"
        title={`Bienvenido, ${user.perfil?.nombreCompleto || session.user.name || session.user.email}`}
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Renta mensual vigente</p><p className="mt-2 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyRent)}</p></div>
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Ingreso neto proyectado</p><p className="mt-2 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyNetIncome)}</p></div>
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Rentabilidad anual</p><p className="mt-2 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{profitability.portfolio.annualReturn === null ? "N/D" : formatPercent(profitability.portfolio.annualReturn)}</p></div>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <Link className="rounded-card border border-border bg-surface p-5 hover:border-brand" href="/configuracion/perfil">
          <h2 className="text-sm font-semibold text-ink">Mi perfil</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Mantén actualizados tu nombre, alias y datos legales.
          </p>
        </Link>
        <Link className="rounded-card border border-border bg-surface p-5 hover:border-brand" href="/propiedades">
          <h2 className="text-sm font-semibold text-ink">Propiedades</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Consulta predios, unidades rentables y contratos asociados.
          </p>
        </Link>
        <Link className="rounded-card border border-border bg-surface p-5 hover:border-brand" href="/reportes"><h2 className="text-sm font-semibold text-ink">Rentabilidad</h2><p className="mt-2 text-sm text-ink-secondary">Compara ingresos, gastos prorrateados y rendimiento por unidad.</p></Link>
      </section>
    </>
  );
}
