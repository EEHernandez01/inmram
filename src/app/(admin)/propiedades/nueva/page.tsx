import { PropertyOnboardingWizard } from "@/components/forms/property-onboarding-wizard";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { listarOpcionesPropietario } from "@/lib/services/foundation";

export default async function NewPropertyPage() {
  await requireSystemRole(WRITE_ROLES);
  const owners = await listarOpcionesPropietario();

  return (
    <>
      <PageHeader description="Registra el predio, sus unidades y contratos en un recorrido guiado." eyebrow="Propiedades" title="Nueva propiedad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <PropertyOnboardingWizard owners={owners} placesEnabled={Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)} />
      </section>
    </>
  );
}
