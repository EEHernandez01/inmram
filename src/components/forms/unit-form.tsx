import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/ui/form-status";

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

export function UnitForm({ defaults, propertyId, submitLabel, unitId }: {
  defaults?: UnitDefaults;
  propertyId: string;
  submitLabel: string;
  unitId?: string;
}) {
  const action = unitId
    ? `/api/propiedades/${propertyId}/unidades/${unitId}`
    : `/api/propiedades/${propertyId}/unidades`;

  return (
    <form action={action} className="space-y-5" method="post">
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
      <FormStatus message={undefined} />
      <button className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
