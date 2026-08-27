import { Field, Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";

export function ProfileForm({ defaults }: { defaults: {
  nombreCompleto: string;
  alias?: string | null;
  razonSocial?: string | null;
  telefono?: string | null;
  rfc?: string | null;
} }) {
  return (
    <form action="/api/perfil" className="space-y-8" method="post">
      <section>
        <div className="mb-5">
          <h3 className="text-base font-bold text-ink">Identidad visible</h3>
          <p className="mt-1 text-sm text-ink-secondary">Estos datos identifican tu cuenta en la navegación y actividad del sistema.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre completo">
          <Input autoComplete="name" defaultValue={defaults.nombreCompleto} maxLength={250} name="nombreCompleto" required />
        </Field>
        <Field label="Alias" hint="Nombre corto visible en el sistema; por ejemplo, Administrador.">
          <Input defaultValue={defaults.alias ?? ""} maxLength={100} name="alias" />
        </Field>
        </div>
      </section>

      <section className="border-t border-brand/10 pt-7">
        <div className="mb-5">
          <h3 className="text-base font-bold text-ink">Contacto y datos legales</h3>
          <p className="mt-1 text-sm text-ink-secondary">La razón social y el RFC son opcionales y se protegen de forma segura.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Razón social" hint="Opcional; se usará como titular legal de las propiedades.">
          <Input defaultValue={defaults.razonSocial ?? ""} maxLength={250} name="razonSocial" />
        </Field>
        <Field label="Teléfono" hint="Opcional">
          <Input autoComplete="tel" defaultValue={defaults.telefono ?? ""} maxLength={20} name="telefono" type="tel" />
        </Field>
        <Field label="RFC" hint="Opcional; se almacena cifrado.">
          <Input autoCapitalize="characters" autoComplete="off" defaultValue={defaults.rfc ?? ""} maxLength={13} name="rfc" />
        </Field>
        </div>
      </section>
      <div className="flex flex-col gap-3 border-t border-brand/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-secondary">Los campos con datos fiscales son opcionales.</p>
        <Button className="rounded-xl px-5 shadow-[4px_4px_9px_#b8c2cd]" type="submit">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
