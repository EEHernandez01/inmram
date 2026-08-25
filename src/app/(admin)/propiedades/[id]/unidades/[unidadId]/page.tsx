import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteUnitAction } from "@/app/_actions/foundation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { ReceiptBadge } from "@/components/collection/receipt-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency, formatDate } from "@/lib/format";
import { obtenerUnidad } from "@/lib/services/foundation";

const typeLabels = { DEPARTAMENTO: "Departamento", LOCAL_COMERCIAL: "Local comercial", ACCESORIA: "Accesoria", BODEGA: "Bodega", OFICINA: "Oficina", OTRO: "Otro" } as const;
const formatReceiptPeriod = (value: Date) => new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC", year: "numeric" }).format(value);

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string; unidadId: string }> }) {
  const { id, unidadId } = await params;
  const [{ user }, unit] = await Promise.all([getSystemUser(), obtenerUnidad(unidadId)]);
  if (!unit || unit.propiedadId !== id) notFound();
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const activeContract = unit.contratos.find((contract) => contract.estado === "ACTIVO");

  return (
    <>
      <PageHeader action={canWrite ? <Link className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_9px_#b8c2cd] hover:bg-brand-hover" href={`/propiedades/${id}/unidades/${unidadId}/editar`}>Editar unidad</Link> : null} description={unit.propiedad.direccion} eyebrow={typeLabels[unit.tipo]} title={`Unidad ${unit.identificador}`} />

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.55fr)]">
        <div className="rounded-3xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Características</p><h2 className="mt-1 font-serif text-xl font-semibold text-ink">Distribución de la unidad</h2></div><span className="rounded-full bg-brand/8 px-3 py-1.5 text-xs font-bold text-brand">{typeLabels[unit.tipo]}</span></div><dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-brand/10 sm:grid-cols-4">{[["Superficie", `${unit.metrosCuadrados.toString()} m²`], ["Piso", unit.piso || "No especificado"], ["Recámaras", String(unit.recamaras)], ["Baños", `${unit.banosCompletos}${unit.mediosBanos ? ` + ${unit.mediosBanos} medio` : ""}`]].map(([label, value], index) => <div className={`min-w-0 p-4 ${index % 2 === 0 ? "border-r border-brand/10 sm:border-r-0" : ""} ${index < 2 ? "border-b border-brand/10 sm:border-b-0" : ""} ${index > 1 ? "sm:border-l sm:border-brand/10" : ""}`} key={label}><dt className="text-[10px] font-bold uppercase tracking-[.08em] text-ink-secondary">{label}</dt><dd className="mt-2 text-base font-bold text-ink [font-variant-numeric:tabular-nums]">{value}</dd></div>)}</dl>{unit.descripcion ? <div className="mt-6 border-t border-brand/10 pt-5"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-secondary">Descripción</p><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-secondary">{unit.descripcion}</p></div> : null}</div>
        <aside className="self-start rounded-3xl bg-brand p-6 text-white shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/65">Estado de ocupación</p><p className="mt-2 font-serif text-2xl font-semibold">{unit.contratos.some((contract) => contract.estado === "ACTIVO") ? "Con contrato activo" : "Disponible"}</p><p className="mt-3 text-sm leading-6 text-white/75">{unit.contratos.some((contract) => contract.estado === "ACTIVO") ? "Esta unidad tiene un contrato vigente." : "No hay un contrato activo asociado a esta unidad."}</p>{canWrite && !unit.contratos.some((contract) => contract.estado === "ACTIVO") ? <Link className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand shadow-sm hover:bg-white/90" href={`/propiedades/${id}/unidades/${unidadId}/contratos/nuevo`}>Nuevo contrato</Link> : null}</aside>
      </section>

      {activeContract ? <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Contrato vigente</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Historial de pagos</h2><p className="mt-1 text-sm text-ink-secondary">{activeContract.arrendatario} · pagos registrados de este contrato.</p></div><div className="flex gap-4"><Link className="text-sm font-semibold text-brand hover:text-brand-hover" href={`/contratos/${activeContract.id}`}>Ver contrato</Link><Link className="text-sm font-semibold text-brand hover:text-brand-hover" href="/cobranza">Gestionar cobranza</Link></div></div>
        {activeContract.recibos.length === 0 ? <EmptyState description="Aún no se han generado recibos para el contrato vigente." title="Sin pagos registrados" /> : <div className="overflow-x-auto rounded-3xl bg-bg shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-brand/10 text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary"><tr><th className="px-6 py-4">Periodo</th><th className="px-6 py-4">Vencimiento</th><th className="px-6 py-4">Estatus</th><th className="px-6 py-4">Pago registrado</th><th className="px-6 py-4 text-right">Total</th></tr></thead><tbody className="divide-y divide-brand/10">{activeContract.recibos.map((receipt) => <tr className="transition hover:bg-white/35" key={receipt.id}><td className="px-6 py-5 font-semibold capitalize text-ink">{formatReceiptPeriod(receipt.periodo)}</td><td className="px-6 py-5 text-ink-secondary">{formatDate(receipt.fechaVencimiento)}</td><td className="px-6 py-5"><ReceiptBadge status={receipt.estatus} /></td><td className="px-6 py-5 text-ink-secondary">{receipt.fechaPago ? `${formatDate(receipt.fechaPago)} · ${receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}` : "Pendiente"}</td><td className="px-6 py-5 text-right font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(Number(receipt.monto) + Number(receipt.cargoAgua ?? 0) + Number(receipt.cargoFijo))}</td></tr>)}</tbody></table></div>}
      </section> : null}

      <section className="mt-8">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Administración</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Historial de contratos</h2><p className="mt-1 text-sm text-ink-secondary">Consulta los arrendamientos asociados a esta unidad.</p></div>
        {unit.contratos.length === 0 ? <EmptyState description="La unidad aún no tiene contratos asociados." title="Sin contratos" /> : (
          <div className="overflow-x-auto rounded-3xl bg-bg shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-brand/10 text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary"><tr><th className="px-6 py-4">Arrendatario</th><th className="px-6 py-4">Vigencia</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Renta mensual</th></tr></thead><tbody className="divide-y divide-brand/10">{unit.contratos.map((contract) => <tr className="transition hover:bg-white/35" key={contract.id}><td className="px-6 py-5"><Link className="font-semibold text-brand hover:text-brand-hover" href={`/contratos/${contract.id}`}>{contract.arrendatario}</Link></td><td className="px-6 py-5 text-ink-secondary">{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</td><td className="px-6 py-5"><span className={contract.estado === "VENCIDO" ? "inline-flex rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger" : "inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"}>{contract.estado === "ACTIVO" ? "Activo" : "Vencido"}</span></td><td className="px-6 py-5 text-right font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(contract.rentaMensualBase)}</td></tr>)}</tbody></table></div>
        )}
      </section>

      {canWrite && !unit.medidorAgua && unit.contratos.length === 0 ? <section className="mt-8 border-t border-border pt-5"><form action={deleteUnitAction.bind(null, unidadId, id)}><ConfirmSubmitButton message="¿Eliminar esta unidad? Esta acción no se puede deshacer.">Eliminar unidad</ConfirmSubmitButton></form></section> : null}
    </>
  );
}

