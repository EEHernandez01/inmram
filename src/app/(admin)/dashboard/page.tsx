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
  const receiptsWithPayments = collection.receipts.filter(
    (receipt) => receipt.montoPagado > 0,
  ).length;
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

  return (
    <>
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 py-3 text-base font-bold text-white transition-colors hover:bg-brand-hover"
            href={overdueReceipts.length > 0 ? `${collectionHref}&estatus=VENCIDO` : pendingPayments.length > 0 ? `${collectionHref}&estatus=PENDIENTE` : collectionHref}
          >
            {overdueReceipts.length > 0 ? "Revisar pagos vencidos" : pendingPayments.length > 0 ? "Ver pagos pendientes" : "Abrir cobranza del mes"}
          </Link>
        }
        description="Consulta lo cobrado, lo que falta y los pagos vencidos de un vistazo."
        eyebrow="Inicio"
        title={`Hola, ${user.perfil?.nombreCompleto || session.user.name || session.user.email}`}
      />

      <section aria-label="Estado de la cobranza del mes" className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Estado de cobranza</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold capitalize text-ink">{period.toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
          <p className="mt-1 text-base text-ink-secondary">Total esperado: {formatCurrency(collection.summary.esperado)}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div aria-label={`${formatPercent(collectionRate)} del total esperado cobrado`} className="h-4 min-w-48 flex-1 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={collectionRate}>
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${collectionRate}%` }} />
          </div>
          <p className="text-lg font-bold text-brand [font-variant-numeric:tabular-nums]">{formatPercent(collectionRate)} cobrado</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link className="min-h-28 rounded-xl border border-success/20 border-l-4 bg-success-soft/50 p-4 transition-colors hover:bg-success-soft" href={`/reportes/pagos?periodo=${periodValue}`}>
            <div className="flex items-center gap-2 text-success"><svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><p className="text-base font-bold">Cobrado</p></div>
            <p className="mt-2 text-2xl font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(collection.summary.cobrado)}</p>
            <p className="mt-1 text-sm text-ink-secondary">{receiptsWithPayments} {receiptsWithPayments === 1 ? "recibo con pago registrado" : "recibos con pago registrado"}</p>
          </Link>

          <Link className="min-h-28 rounded-xl border border-brand/20 border-l-4 bg-brand-soft/50 p-4 transition-colors hover:bg-brand-soft" href={`${collectionHref}&estatus=PENDIENTE`}>
            <div className="flex items-center gap-2 text-brand"><svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><p className="text-base font-bold">Por cobrar</p></div>
            <p className="mt-2 text-2xl font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(pendingBalance - overdueBalance)}</p>
            <p className="mt-1 text-sm text-ink-secondary">{pendingPayments.length - overdueReceipts.length} {pendingPayments.length - overdueReceipts.length === 1 ? "pago pendiente" : "pagos pendientes"}</p>
          </Link>

          <Link className={overdueReceipts.length > 0 ? "min-h-28 rounded-xl border border-danger/20 border-l-4 bg-danger-soft/50 p-4 transition-colors hover:bg-danger-soft" : "min-h-28 rounded-xl border border-success/20 border-l-4 bg-success-soft/50 p-4 transition-colors hover:bg-success-soft"} href={`${collectionHref}&estatus=VENCIDO`}>
            <div className={overdueReceipts.length > 0 ? "flex items-center gap-2 text-danger" : "flex items-center gap-2 text-success"}><svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg><p className="text-base font-bold">Vencidos</p></div>
            <p className="mt-2 text-2xl font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(overdueBalance)}</p>
            <p className="mt-1 text-sm text-ink-secondary">{overdueReceipts.length} {overdueReceipts.length === 1 ? "pago vencido" : "pagos vencidos"}</p>
          </Link>
        </div>
      </section>

      <section className="mt-6" aria-label="Pagos por atender">
        <CollectionFollowUp
          collectionHref={collectionHref}
          currentDate={currentDate}
          hasReceipts={collection.receipts.length > 0}
          pendingPayments={pendingPayments}
        />
      </section>

      <section aria-label="Resumen del portafolio" className="mt-7">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Resumen de propiedades</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/30" href="/propiedades">
            <p className="text-sm font-semibold text-ink-secondary">Unidades ocupadas</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{occupiedUnits} <span className="text-xl font-semibold text-ink-secondary">de {totalUnits}</span></p>
            <p className="mt-2 text-base text-ink-secondary">Con contrato activo <span aria-hidden="true" className="ml-1 font-bold text-brand transition-transform group-hover:translate-x-0.5">→</span></p>
          </Link>

          <Link className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/30" href="/reportes">
            <p className="text-sm font-semibold text-ink-secondary">Renta neta mensual estimada</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(profitability.portfolio.monthlyNetIncome)}</p>
            <p className="mt-2 text-base text-ink-secondary">Basada en rentas y gastos registrados <span aria-hidden="true" className="ml-1 font-bold text-brand transition-transform group-hover:translate-x-0.5">→</span></p>
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-semibold text-ink">Unidades disponibles</h2><p className="mt-1 text-base text-ink-secondary">Unidades sin contrato activo, listas para revisar o asignar.</p></div><Link className="inline-flex min-h-11 items-center text-base font-bold text-brand hover:text-brand-hover" href="/propiedades">Ver todas <span aria-hidden="true" className="ml-1">→</span></Link></div>
          {availableUnits.length === 0 ? <div className="rounded-2xl border border-border bg-surface p-6"><p className="font-semibold text-ink">Todas las unidades tienen contrato activo.</p><p className="mt-2 text-sm text-ink-secondary">No hay vacantes que atender en este momento.</p></div> : <div className="grid gap-4 md:grid-cols-2">{availableUnits.slice(0, 4).map(({ property, ...unit }) => <article className="rounded-2xl border border-border bg-surface p-5" key={unit.id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.1em] text-brand">{unitTypeLabels[unit.tipo]}</p><Link className="mt-1 block font-serif text-xl font-semibold text-ink hover:text-brand" href={`/propiedades/${property.id}/unidades/${unit.id}`}>Unidad {unit.identificador}</Link><p className="mt-1 truncate text-sm text-ink-secondary">{property.direccion}</p></div><span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">Disponible</span></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-sm text-ink-secondary"><span className="font-bold text-ink">{unit.metrosCuadrados.toLocaleString("es-MX")}</span> m²</p><Link className="rounded-xl bg-brand px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href={canWrite ? `/propiedades/${property.id}/unidades/${unit.id}/contratos/nuevo` : `/propiedades/${property.id}/unidades/${unit.id}`}>{canWrite ? "Crear contrato" : "Ver unidad"}</Link></div></article>)}</div>}
          {availableUnits.length > 4 ? <p className="mt-4 text-sm text-ink-secondary">Mostrando 4 de {availableUnits.length} unidades disponibles. <Link className="font-bold text-brand hover:text-brand-hover" href="/propiedades">Ver todas</Link></p> : null}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-semibold text-ink">Contratos por vencer</h2>{expiringContractsTotal > expiringContracts.length ? <p className="mt-1 text-base text-ink-secondary">Mostrando los {expiringContracts.length} más próximos de {expiringContractsTotal} contratos.</p> : <p className="mt-1 text-base text-ink-secondary">Revisa las fechas de término próximas.</p>}</div><Link className="inline-flex min-h-11 items-center text-base font-bold text-brand hover:text-brand-hover" href="/contratos">Ver contratos <span aria-hidden="true" className="ml-1">→</span></Link></div>
          {expiringContractsTotal === 0 ? <div className="rounded-2xl border border-border bg-surface p-6"><p className="font-semibold text-ink">No hay contratos por vencer en los próximos 90 días.</p><p className="mt-2 text-sm text-ink-secondary">Cuando se acerque una fecha de término, aparecerá aquí.</p></div> : <div className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="divide-y divide-border">{expiringContracts.map((contract) => { const days = contractExpirationAlertDays(contract.fechaFin, currentDate); return <Link className="flex flex-col gap-3 p-5 transition-colors hover:bg-bg sm:flex-row sm:items-center sm:justify-between" href={`/contratos/${contract.id}`} key={contract.id}><div className="min-w-0"><p className="font-semibold text-ink">{contract.arrendatario}</p><p className="mt-1 truncate text-sm text-ink-secondary">{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className={days <= 30 ? "rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger" : "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning"}>{expirationLabel(days)}</span><span className="text-sm font-semibold text-brand">{formatDate(contract.fechaFin)}</span></div></Link>; })}</div></div>}
        </div>
      </section>
    </>
  );
}
