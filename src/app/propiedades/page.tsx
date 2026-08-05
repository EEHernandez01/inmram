import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency } from "@/lib/format";
import { listarPropiedades } from "@/lib/services/foundation";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const [{ user }, properties] = await Promise.all([getSystemUser(), listarPropiedades()]);
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const newLink = canWrite ? (
    <Link className="inline-flex rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href="/propiedades/nueva">Nueva propiedad</Link>
  ) : null;

  return (
    <>
      <PageHeader action={newLink} description="Predios físicos y sus espacios rentables asociados." eyebrow="Fundación" title="Propiedades" />
      <section className="mt-7">
        {properties.length === 0 ? (
          <EmptyState action={newLink} description="Crea el primer predio para comenzar a registrar unidades." title="Aún no hay propiedades" />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="px-5 py-3">Dirección</th><th className="px-5 py-3">Unidades</th><th className="px-5 py-3 text-right">Valor comercial</th></tr></thead>
              <tbody className="divide-y divide-border">
                {properties.map((property) => (
                  <tr className="hover:bg-bg/50" key={property.id}>
                    <td className="px-5 py-4"><Link className="font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${property.id}`}>{property.direccion}</Link></td>
                    <td className="px-5 py-4 text-ink-secondary [font-variant-numeric:tabular-nums]">{property._count.unidades}</td>
                    <td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorComercialTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
