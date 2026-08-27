import { ProfileForm } from "@/components/forms/profile-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser } from "@/lib/auth/authorization";
import { obtenerPerfilActual } from "@/lib/services/profile";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; guardado?: string; required?: string }> }) {
  const [{ session, user }, profile, query] = await Promise.all([getSystemUser(), obtenerPerfilActual(), searchParams]);
  const displayName = profile?.nombreCompleto || session.user.name || session.user.email;
  const roleLabels = {
    ADMINISTRADOR: "Administrador",
    GESTOR: "Gestor",
    PROPIETARIO: "Propietario",
    SOLO_LECTURA: "Solo lectura",
  } as const;

  return (
    <>
      <PageHeader description="Tu identidad visible y los datos legales asociados a la cuenta." eyebrow="Configuración" title="Mi perfil" />
      {query.required ? <Alert className="mt-7" variant="warning">Completa tu perfil para poder registrar propiedades.</Alert> : null}
      {query.guardado ? <Alert className="mt-7" variant="success">Perfil actualizado correctamente.</Alert> : null}
      {query.error ? <Alert className="mt-7" variant="danger">{query.error}</Alert> : null}
      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="rounded-3xl bg-bg p-6 shadow-[8px_8px_18px_#c6cdd6,-8px_-8px_18px_#fff] sm:p-8">
          <div className="border-b border-brand/10 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Información personal</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">Datos de tu cuenta</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">Mantén estos datos actualizados para que tu información aparezca correctamente en el sistema y en los documentos relacionados.</p>
          </div>
          <div className="pt-7">
            <ProfileForm defaults={{ nombreCompleto: profile?.nombreCompleto || session.user.name || "", alias: profile?.alias ?? session.user.name, razonSocial: profile?.razonSocial, telefono: profile?.telefono, rfc: profile?.rfc }} />
          </div>
        </section>

        <aside className="rounded-3xl bg-brand p-6 text-white shadow-[8px_8px_18px_#c6cdd6,-8px_-8px_18px_#fff] sm:p-7 xl:p-6">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-serif text-2xl font-semibold text-white ring-1 ring-white/15">{displayName.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{displayName}</p>
              <span className="mt-2 inline-flex rounded-pill bg-white/15 px-2.5 py-1 text-xs font-bold text-white/85">{roleLabels[user.rol]}</span>
            </div>
          </div>
          <div className="mt-6 border-t border-white/15 pt-5 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/55">Correo vinculado</p>
              <p className="mt-2 break-all font-medium text-white/90">{session.user.email}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
