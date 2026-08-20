import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/ui/form-status";
import { Button } from "@/components/ui/button";

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
  recamaras?: number;
  banosCompletos?: number;
  mediosBanos?: number;
  amenidades?: string | null;
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
        <Field label="Recámaras"><Input defaultValue={defaults?.recamaras ?? 0} min={0} name="recamaras" type="number" /></Field>
        <Field label="Baños completos"><Input defaultValue={defaults?.banosCompletos ?? 0} min={0} name="banosCompletos" type="number" /></Field>
        <Field label="Medios baños"><Input defaultValue={defaults?.mediosBanos ?? 0} min={0} name="mediosBanos" type="number" /></Field>
      </div>
      <Field label="Descripción" hint="Opcional">
        <Textarea defaultValue={defaults?.descripcion ?? ""} maxLength={2000} name="descripcion" rows={4} />
      </Field>
      <Field label="Amenidades" hint="Separadas por coma; ej. estacionamiento, balcón, elevador">
        <div className="grid grid-cols-2 gap-2 text-sm font-normal sm:grid-cols-3">{["Estacionamiento", "Balcón", "Elevador", "Cisterna", "Aire acondicionado", "Amueblado"].map((item) => <label className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2" key={item}><input defaultChecked={defaults?.amenidades?.split(", ").includes(item)} name="amenidades" type="checkbox" value={item} />{item}</label>)}</div>
      </Field>
      <FormStatus message={undefined} />
      <Button type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}
