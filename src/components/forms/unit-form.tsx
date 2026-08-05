import type { FoundationActionState } from "@/app/_actions/foundation";
import { FoundationForm } from "@/components/forms/foundation-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";

const unitTypes = [
  ["DEPARTAMENTO", "Departamento"],
  ["LOCAL_COMERCIAL", "Local comercial"],
  ["ACCESORIA", "Accesoria"],
  ["BODEGA", "Bodega"],
  ["OFICINA", "Oficina"],
  ["OTRO", "Otro"],
] as const;

type UnitDefaults = {
  identificador: string;
  tipo: string;
  metrosCuadrados: string;
  descripcion?: string | null;
  piso?: string | null;
};

export function UnitForm({ action, defaults, propertyId, submitLabel }: {
  action: (state: FoundationActionState | undefined, formData: FormData) => Promise<FoundationActionState | undefined>;
  defaults?: UnitDefaults;
  propertyId: string;
  submitLabel: string;
}) {
  return (
    <FoundationForm action={action} submitLabel={submitLabel}>
      <input name="propiedadId" type="hidden" value={propertyId} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Identificador">
          <Input defaultValue={defaults?.identificador} maxLength={100} name="identificador" placeholder="101, Local A…" required />
        </Field>
        <Field label="Tipo de unidad">
          <Select defaultValue={defaults?.tipo ?? ""} name="tipo" required>
            <option value="">Selecciona un tipo</option>
            {unitTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Superficie (m²)">
          <Input defaultValue={defaults?.metrosCuadrados} inputMode="decimal" name="metrosCuadrados" placeholder="0.00" required />
        </Field>
        <Field label="Piso" hint="Opcional">
          <Input defaultValue={defaults?.piso ?? ""} maxLength={50} name="piso" />
        </Field>
      </div>
      <Field label="Descripción" hint="Opcional">
        <Textarea defaultValue={defaults?.descripcion ?? ""} maxLength={2000} name="descripcion" rows={4} />
      </Field>
    </FoundationForm>
  );
}
