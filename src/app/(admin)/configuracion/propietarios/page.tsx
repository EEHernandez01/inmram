import { OwnerCatalogForm } from "@/components/forms/owner-catalog-form";
import { PageHeader } from "@/components/ui/page-header";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { listarPropietarios } from "@/lib/services/foundation";

export default async function OwnersPage() {
  await requireSystemRole(ADMIN_ROLES);
  const propietarios = await listarPropietarios();

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Propietarios"
        description="Administra el catálogo interno de titulares y sus datos de contacto."
      />
      <section className="mt-7 rounded-card border border-border bg-surface p-5 sm:p-7">
        <OwnerCatalogForm propietarios={propietarios} />
      </section>
    </>
  );
}
