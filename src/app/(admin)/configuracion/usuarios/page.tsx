import { AdminUserForm } from "@/components/forms/admin-user-form";
import { PageHeader } from "@/components/ui/page-header";
import { RolUsuario } from "@/generated/prisma/enums";
import { requireSystemRole } from "@/lib/auth/authorization";

export default async function UsersPage() {
  await requireSystemRole([RolUsuario.DUENO]);

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Alta de usuario"
        description="Crea una cuenta de acceso y su registro interno en UsuarioSistema."
      />

      <section className="mt-7 max-w-xl rounded-card border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Nuevo usuario</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          La contraseña se guarda en Neon Auth. En <span className="font-semibold text-ink">UsuarioSistema</span> solo queda la referencia del usuario y su rol.
        </p>
        <div className="mt-5">
          <AdminUserForm />
        </div>
      </section>
    </>
  );
}