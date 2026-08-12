/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PropertyCover } from "@/components/maps/property-cover";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency } from "@/lib/format";
import { listarPropiedades } from "@/lib/services/foundation";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const [{ user }, properties] = await Promise.all([getSystemUser(), listarPropiedades()]);
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const newLink = canWrite ? <Link className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_9px_#b8c2cd] hover:bg-brand-hover" href="/propiedades/nueva">Agregar propiedad</Link> : null;

  return <>
    <PageHeader action={newLink} description="Explora tu portafolio como un catálogo: ubicación, valor y espacios disponibles en una sola vista." eyebrow="Portafolio inmobiliario" title="Propiedades" />
    <section className="mt-7">
      {properties.length === 0 ? <EmptyState action={newLink} description="Agrega el primer inmueble para comenzar a registrar sus unidades y contratos." title="Tu portafolio está vacío" /> : <>
        <div className="mb-5 flex items-center justify-between"><p className="text-sm text-ink-secondary"><span className="font-bold text-ink">{properties.length}</span> {properties.length === 1 ? "inmueble registrado" : "inmuebles registrados"}</p><p className="hidden text-sm text-ink-secondary sm:block">Selecciona una propiedad para ver sus unidades</p></div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => <Link className="group overflow-hidden rounded-3xl bg-bg shadow-[8px_8px_18px_#c6cdd6,-8px_-8px_18px_#fff] transition duration-200 hover:-translate-y-1 hover:shadow-[11px_11px_22px_#c2c9d2,-9px_-9px_20px_#fff]" href={`/propiedades/${property.id}`} key={property.id}>
            <div className="relative h-48 overflow-hidden bg-brand">{property.archivos[0] ? <img alt={`Foto de ${property.direccion}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={property.archivos[0].url} /> : <PropertyCover address={property.direccion} />}{property.marca?.nombreComercial ? <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand shadow-sm backdrop-blur">{property.marca.nombreComercial}</span> : null}</div>
            <div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand/70">Inmueble</p><h2 className="mt-1 line-clamp-2 font-serif text-xl font-semibold leading-snug text-ink group-hover:text-brand">{property.direccion}</h2><p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary"><svg aria-hidden="true" className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>{property.latitud && property.longitud ? "Ubicación verificada" : "Ubicación pendiente"}</p>
              <div className="my-5 h-px bg-brand/10" /><div className="grid grid-cols-2 gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Valor comercial</p><p className="mt-1 text-sm font-bold text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorComercialTotal)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Espacios</p><p className="mt-1 text-sm font-bold text-ink"><span className="text-lg text-brand [font-variant-numeric:tabular-nums]">{property._count.unidades}</span> unidades</p></div></div>
              <div className="mt-5 flex items-center justify-between border-t border-brand/10 pt-4 text-xs"><span className="text-ink-secondary">Predial anual</span><span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.predialAnual)}</span></div><div className="mt-4 flex items-center justify-between text-sm font-bold text-brand"><span>Ver inmueble</span><span aria-hidden="true">→</span></div>
            </div>
          </Link>)}
        </div>
      </>}
    </section>
  </>;
}
