import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { listarContratos } from "@/lib/services/foundation";
import { listarAlertasRenovacion } from "@/lib/services/inflation";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const [contracts, alerts] = await Promise.all([listarContratos(), listarAlertasRenovacion()]);

  return (
    <>
      <PageHeader description="Contratos vigentes y vencidos de todas las unidades." eyebrow="Fundación" title="Contratos" />
      {alerts.length > 0 ? <section className="mt-7 space-y-3"><h2 className="text-sm font-semibold text-ink">Próximos vencimientos</h2>{alerts.map((contract) => <Link className={contract.nivel === "CRITICO" ? "block rounded-card border border-danger bg-danger-soft px-4 py-3 text-sm text-danger" : "block rounded-card border border-warning bg-warning-soft px-4 py-3 text-sm text-warning"} href={`/contratos/${contract.id}`} key={contract.id}><span className="font-semibold">{contract.arrendatario}</span> · {contract.unidad.propiedad.direccion}, unidad {contract.unidad.identificador} · vence en {contract.dias} días</Link>)}</section> : null}
      <section className="mt-7">
        {contracts.length === 0 ? <EmptyState description="Crea un contrato desde el detalle de una unidad disponible." title="Aún no hay contratos" /> : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="px-5 py-3">Arrendatario</th><th className="px-5 py-3">Propiedad / unidad</th><th className="px-5 py-3">Vigencia</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Renta</th></tr></thead>
              <tbody className="divide-y divide-border">{contracts.map((contract) => <tr className="hover:bg-bg/50" key={contract.id}><td className="px-5 py-4"><Link className="font-semibold text-brand hover:text-brand-hover" href={`/contratos/${contract.id}`}>{contract.arrendatario}</Link></td><td className="px-5 py-4 text-ink-secondary">{contract.unidad.propiedad.direccion} · {contract.unidad.identificador}</td><td className="px-5 py-4 text-ink-secondary">{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</td><td className="px-5 py-4"><span className={contract.estado === "VENCIDO" ? "inline-flex rounded-pill bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger" : "inline-flex rounded-pill bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"}>{contract.estado === "ACTIVO" ? "Activo" : "Vencido"}</span></td><td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(contract.rentaMensualBase)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
