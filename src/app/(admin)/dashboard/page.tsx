import Link from "next/link";

import { CollectionFollowUp } from "@/components/dashboard/collection-follow-up";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  currentCollectionDate,
  currentReceiptPeriod,
  receiptPeriodValue,
} from "@/lib/calculations/collection";
import { contractExpirationAlertDays } from "@/lib/calculations/inflation";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { listarCobranzaMensual } from "@/lib/services/collection";
import { listarProximosVencimientosContrato } from "@/lib/services/dashboard";
import { obtenerReporteRentabilidad } from "@/lib/services/reports";

const unitTypeLabels = {
  ACCESORIA: "Accesoria",
  BODEGA: "Bodega",
  DEPARTAMENTO: "Departamento",
  LOCAL_COMERCIAL: "Local comercial",
  OFICINA: "Oficina",
  OTRO: "Otra unidad",
} as const;

function expirationLabel(days: number) {
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentDate = currentCollectionDate();
  const period = currentReceiptPeriod(currentDate);
  const periodValue = receiptPeriodValue(period);
  const [
    { session, user },
    profitability,
    collection,
    { contracts: expiringContracts, total: expiringContractsTotal },
  ] =
    await Promise.all([
      getSystemUser(),
      obtenerReporteRentabilidad(),
      listarCobranzaMensual({ period, now: currentDate }),
      listarProximosVencimientosContrato(currentDate),
    ]);
  const canWrite = WRITE_ROLES.includes(
    user.rol as (typeof WRITE_ROLES)[number],
  );
  const collectionHref = `/cobranza?periodo=${periodValue}`;
  const collectionRate = Math.min(
    Math.max(collection.summary.porcentajeCobrado, 0),
    100,
  );
  const collectionCircumference = (collectionRate / 100) * 2 * Math.PI * 24;
  const pendingPayments = collection.receipts
    .filter(
      (receipt) =>
        (receipt.estatus === "PENDIENTE" || receipt.estatus === "VENCIDO") && receipt.saldoPendiente > 0,
    )
    .sort((first, second) => {
      const firstPriority = first.estatus === "VENCIDO" ? 0 : 1;
      const secondPriority = second.estatus === "VENCIDO" ? 0 : 1;
      return (
        firstPriority - secondPriority ||
        first.fechaVencimiento.getTime() - second.fechaVencimiento.getTime()
      );
    });
  const pendingBalance = pendingPayments.reduce(
    (total, receipt) => total + receipt.saldoPendiente,
    0,
  );
  const overdueReceipts = pendingPayments.filter(
    (receipt) => receipt.estatus === "VENCIDO",
  );
  const overdueBalance = overdueReceipts.reduce(
    (total, receipt) => total + receipt.saldoPendiente,
    0,
  );
  const availableUnits = profitability.properties.flatMap((property) =>
    property.units
      .filter((unit) => !unit.tieneContratoActivo)
      .map((unit) => ({ ...unit, property })),
  );
  const totalUnits = profitability.properties.reduce(
    (total, property) => total + property.units.length,
    0,
  );
  const occupiedUnits = totalUnits - availableUnits.length;
  const occupancyRate =
    totalUnits === 0 ? null : (occupiedUnits / totalUnits) * 100;

  return (
    <>
      <PageHeader
        action={
          <Link
            className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            href={overdueReceipts.length ? `${collectionHref}&estatus=VENCIDO` : collectionHref}
          >
            {overdueReceipts.length ? "Atender pagos vencidos" : "Revisar cobranza"}
          </Link>
        }
        description="Ve el avance de cobranza y las tareas que requieren atención en tu portafolio."
        eyebrow="Inicio"
        title={`Hola, ${user.perfil?.nombreCompleto || session.user.name || session.user.email}`}
      />

      <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(360px,.95fr)_minmax(0,1.05fr)]">
        <CollectionFollowUp
          collectionHref={collectionHref}
          currentDate={currentDate}
          hasReceipts={collection.receipts.length > 0}
          pendingPayments={pendingPayments}
        />
        <article className="relative overflow-hidden rounded-card border border-brand/10 bg-brand p-6 text-white sm:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10 bg-white/5" />
          <div aria-hidden="true" className="absolute -bottom-28 right-20 h-56 w-56 rounded-full bg-white/[.035]" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/65">Resumen ejecutivo</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold capitalize sm:text-3xl">Cobranza de {period.toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold">{collection.receipts.length} {collection.receipts.length === 1 ? "recibo" : "recibos"}</span>
            </div>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div aria-label={`Avance de cobranza: ${formatPercent(collectionRate)}`} className="relative grid size-28 shrink-0 place-items-center self-center sm:self-auto" role="img">
                <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 56 56">
                  <circle className="text-white/20" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeWidth="5" />
                  <circle className="text-white" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeDasharray={`${collectionCircumference} ${2 * Math.PI * 24}`} strokeLinecap="round" strokeWidth="5" />
                </svg>
                <span aria-hidden="true" className="absolute text-xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">{formatPercent(collectionRate)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/80">Avance de cobranza</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{formatCurrency(collection.summary.cobrado)} cobrados de {formatCurrency(collection.summary.esperado)} esperados.</p>
                <div aria-label={`${formatPercent(collectionRate)} del monto esperado cobrado`} className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={collectionRate}>
                  <div className="h-full rounded-full bg-white" style={{ width: `${collectionRate}%` }} />
                </div>
                <div className="mt-2 flex justify-between gap-3 text-xs text-white/65"><span>Cobrado</span><span>Por cobrar {formatCurrency(pendingBalance)}</span></div>
              </div>
            </div>

            <div className="mt-7 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-[.1em] text-white/60">Cobrado</p><p className="mt-1 text-lg font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(collection.summary.cobrado)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[.1em] text-white/60">Por cobrar</p><p className="mt-1 text-lg font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(pendingBalance)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[.1em] text-white/60">Vencido</p><p className="mt-1 text-lg font-bold [font-variant-numeric:tabular-nums]">{formatCurrency(overdueBalance)}</p></div>
            </div>

            <Link className="mt-7 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-white/90" href={collectionHref}>Ver cobranza completa <span aria-hidden="true" className="ml-1">→</span></Link>
          </div>
        </article>

      </section>

      <section aria-label="Indicadores del portafolio" className="mt-5 grid gap-4 sm:grid-cols-3">
        <Link className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/30" href="/propiedades">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">Ocupación</p><p className="mt-2 text-2xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{occupancyRate === null ? "—" : formatPercent(occupancyRate)}</p><p className="mt-1 text-sm text-ink-secondary">Unidades ocupadas</p></div><div aria-hidden="true" className="relative grid size-16 shrink-0 place-items-center"><svg className="size-full -rotate-90" viewBox="0 0 56 56"><circle className="text-brand-soft" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeWidth="5"/><circle className="text-brand" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeDasharray={`${occupancyRate === null ? 0 : (Math.min(100, Math.max(0, occupancyRate)) / 100) * 2 * Math.PI * 24} ${2 * Math.PI * 24}`} strokeLinecap="round" strokeWidth="5"/></svg><span className="absolute text-xs font-bold text-brand">{totalUnits === 0 ? "—" : `${occupiedUnits}/${totalUnits}`}</span></div></div>
          <p className="mt-3 text-sm text-ink-secondary">Unidades con contrato activo <span aria-hidden="true" className="ml-1 font-bold text-brand transition-transform group-hover:translate-x-0.5">→</span></p>
        </Link>

        <Link className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/30" href="/reportes">
          <div><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">Renta neta proyectada</p><p className="mt-3 text-3xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyNetIncome)}</p></div>
          <p className="mt-3 text-sm text-ink-secondary">Estimación mensual del portafolio <span aria-hidden="true" className="ml-1 font-bold text-brand transition-transform group-hover:translate-x-0.5">→</span></p>
        </Link>

        <Link className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/30" href="/contratos">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">Renovaciones</p><p className="mt-3 text-3xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{expiringContractsTotal}</p></div><span className={expiringContractsTotal > 0 ? "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning" : "rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"}>{expiringContractsTotal > 0 ? "Próximas" : "Al día"}</span></div>
          <p className="mt-3 text-sm text-ink-secondary">Contratos por vencer en 90 días <span aria-hidden="true" className="ml-1 font-bold text-brand transition-transform group-hover:translate-x-0.5">→</span></p>
        </Link>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">Ocupación</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Unidades disponibles</h2><p className="mt-1 text-sm text-ink-secondary">Unidades sin contrato activo, listas para revisar o asignar.</p></div><Link className="text-sm font-bold text-brand hover:text-brand-hover" href="/propiedades">Ver todas <span aria-hidden="true">→</span></Link></div>
          {availableUnits.length === 0 ? <div className="rounded-2xl border border-border bg-surface p-6"><p className="font-semibold text-ink">Todas las unidades tienen contrato activo.</p><p className="mt-2 text-sm text-ink-secondary">No hay vacantes que atender en este momento.</p></div> : <div className="grid gap-4 md:grid-cols-2">{availableUnits.slice(0, 4).map(({ property, ...unit }) => <article className="rounded-2xl border border-border bg-surface p-5" key={unit.id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">{unitTypeLabels[unit.tipo]}</p><Link className="mt-1 block font-serif text-xl font-semibold text-ink hover:text-brand" href={`/propiedades/${property.id}/unidades/${unit.id}`}>Unidad {unit.identificador}</Link><p className="mt-1 truncate text-sm text-ink-secondary">{property.direccion}</p></div><span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">Disponible</span></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-sm text-ink-secondary"><span className="font-bold text-ink">{unit.metrosCuadrados.toLocaleString("es-MX")}</span> m²</p><Link className="rounded-xl bg-brand px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href={canWrite ? `/propiedades/${property.id}/unidades/${unit.id}/contratos/nuevo` : `/propiedades/${property.id}/unidades/${unit.id}`}>{canWrite ? "Crear contrato" : "Ver unidad"}</Link></div></article>)}</div>}
          {availableUnits.length > 4 ? <p className="mt-4 text-sm text-ink-secondary">Mostrando 4 de {availableUnits.length} unidades disponibles. <Link className="font-bold text-brand hover:text-brand-hover" href="/propiedades">Ver todas</Link></p> : null}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">Renovaciones</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Próximos vencimientos</h2>{expiringContractsTotal > expiringContracts.length ? <p className="mt-1 text-sm text-ink-secondary">Mostrando los {expiringContracts.length} más próximos de {expiringContractsTotal} contratos.</p> : null}</div><Link className="text-sm font-bold text-brand hover:text-brand-hover" href="/contratos">Ver contratos <span aria-hidden="true">→</span></Link></div>
          {expiringContractsTotal === 0 ? <div className="rounded-2xl border border-border bg-surface p-6"><p className="font-semibold text-ink">No hay contratos por vencer en los próximos 90 días.</p><p className="mt-2 text-sm text-ink-secondary">Cuando se acerque una fecha de término, aparecerá aquí.</p></div> : <div className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="divide-y divide-border">{expiringContracts.map((contract) => { const days = contractExpirationAlertDays(contract.fechaFin, currentDate); return <Link className="flex flex-col gap-3 p-5 transition-colors hover:bg-bg sm:flex-row sm:items-center sm:justify-between" href={`/contratos/${contract.id}`} key={contract.id}><div className="min-w-0"><p className="font-semibold text-ink">{contract.arrendatario}</p><p className="mt-1 truncate text-sm text-ink-secondary">{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className={days <= 30 ? "rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger" : "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning"}>{expirationLabel(days)}</span><span className="text-sm font-semibold text-brand">{formatDate(contract.fechaFin)}</span></div></Link>; })}</div></div>}
        </div>
      </section>
    </>
  );
}
