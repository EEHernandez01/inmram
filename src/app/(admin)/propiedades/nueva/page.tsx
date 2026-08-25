import Link from "next/link";

import { PropertyForm } from "@/components/forms/property-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { listarPropietarios } from "@/lib/services/foundation";

export default async function NewPropertyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const query = await searchParams;
  const owners = await listarPropietarios();

  return (
    <>
      <PageHeader description="Registra los valores anuales y comerciales del predio completo." eyebrow="Propiedades" title="Nueva propiedad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <PropertyForm owners={owners} placesEnabled={Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)} submitLabel="Guardar propiedad" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href="/propiedades">Cancelar</Link>
      </section>
    </>
  );
}
