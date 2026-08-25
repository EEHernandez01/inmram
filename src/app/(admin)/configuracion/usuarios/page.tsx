import { AdminUserForm } from "@/components/forms/admin-user-form";
import { PageHeader } from "@/components/ui/page-header";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export default async function UsersPage() {
  await requireSystemRole(ADMIN_ROLES);
  const [owners, users] = await Promise.all([
    prisma.propietario.findMany({ orderBy: { nombre: "asc" } }),
    prisma.usuarioSistema.findMany({ orderBy: { creadoEn: "desc" }, include: { perfil: true, propietario: true } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Gestión de usuarios"
        description="Crea, vincula, activa y ajusta las cuentas que acceden al sistema."
      />

      <section className="mt-7 rounded-card border border-border bg-surface p-5 sm:p-7">
        <h2 className="text-sm font-semibold text-ink">Usuarios del sistema</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Las contraseñas se guardan exclusivamente en Neon Auth. Los propietarios deben vincularse a su registro de inmuebles.
        </p>
        <div className="mt-5">
          <AdminUserForm owners={owners} users={users} />
        </div>
      </section>
    </>
  );
}
