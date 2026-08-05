import Link from "next/link";
import { redirect } from "next/navigation";

import { createPropertyAction } from "@/app/_actions/foundation";
import { PropertyForm } from "@/components/forms/property-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerPropietarioActual } from "@/lib/services/profile";

export default async function NewPropertyPage() {
  await requireSystemRole(WRITE_ROLES);
  const owner = await obtenerPropietarioActual().catch(() => null);
  if (!owner) redirect("/configuracion/perfil?required=1");

  return (
    <>
      <PageHeader description="Registra los valores anuales y comerciales del predio completo." eyebrow="Propiedades" title="Nueva propiedad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <PropertyForm action={createPropertyAction} placesEnabled={Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)} submitLabel="Guardar propiedad" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href="/propiedades">Cancelar</Link>
      </section>
    </>
  );
}
