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
    <form action="/api/perfil" className="space-y-5" method="post">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre completo">
          <Input autoComplete="name" defaultValue={defaults.nombreCompleto} maxLength={250} name="nombreCompleto" required />
        </Field>
        <Field label="Alias" hint="Nombre corto visible en el sistema; por ejemplo, Administrador.">
          <Input defaultValue={defaults.alias ?? ""} maxLength={100} name="alias" />
        </Field>
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
      <Button type="submit">
        Guardar perfil
      </Button>
    </form>
  );
}
