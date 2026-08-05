import { ProfileForm } from "@/components/forms/profile-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser } from "@/lib/auth/authorization";
import { obtenerPerfilActual } from "@/lib/services/profile";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; guardado?: string; required?: string }> }) {
  const [{ session }, profile, query] = await Promise.all([getSystemUser(), obtenerPerfilActual(), searchParams]);

  return (
    <>
      <PageHeader description="Tu identidad visible y los datos legales asociados a la cuenta." eyebrow="Configuración" title="Mi perfil" />
      {query.required ? <Alert className="mt-7" variant="warning">Completa tu perfil para poder registrar propiedades.</Alert> : null}
      {query.guardado ? <Alert className="mt-7" variant="success">Perfil actualizado correctamente.</Alert> : null}
      {query.error ? <Alert className="mt-7" variant="danger">{query.error}</Alert> : null}
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <ProfileForm defaults={{ nombreCompleto: profile?.nombreCompleto || session.user.name || "", alias: profile?.alias ?? session.user.name, razonSocial: profile?.razonSocial, telefono: profile?.telefono, rfc: profile?.rfc }} />
      </section>
    </>
  );
}
