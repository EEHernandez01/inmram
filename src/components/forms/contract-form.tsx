import type { FoundationActionState } from "@/app/_actions/foundation";
import { FoundationForm } from "@/components/forms/foundation-form";
import { Field, Input } from "@/components/ui/form-controls";

type ContractDefaults = {
  arrendatario: string;
  emailArrendatario?: string | null;
  telefonoArrendatario?: string | null;
  aval: string;
  fechaInicio: string;
  plazoMeses: number;
  fechaFin: string;
  rentaMensualBase: string;
  diaPago: number;
  depositoGarantia: string;
  estado: "ACTIVO" | "VENCIDO";
};

export function ContractForm({ action, defaults, propertyId, submitLabel, unitId }: {
  action: (state: FoundationActionState | undefined, formData: FormData) => Promise<FoundationActionState | undefined>;
  defaults?: ContractDefaults;
  propertyId: string;
  submitLabel: string;
  unitId: string;
}) {
  return (
    <FoundationForm action={action} submitLabel={submitLabel}>
      <input name="propiedadId" type="hidden" value={propertyId} />
      <input name="unidadId" type="hidden" value={unitId} />
      <input name="estado" type="hidden" value={defaults?.estado ?? "ACTIVO"} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Arrendatario">
          <Input autoComplete="off" defaultValue={defaults?.arrendatario} maxLength={250} name="arrendatario" required />
        </Field>
        <Field label="Correo del arrendatario (opcional)"><Input autoComplete="email" defaultValue={defaults?.emailArrendatario ?? ""} maxLength={254} name="emailArrendatario" type="email" /></Field>
        <Field label="Teléfono del arrendatario (opcional)"><Input autoComplete="tel" defaultValue={defaults?.telefonoArrendatario ?? ""} maxLength={20} name="telefonoArrendatario" type="tel" /></Field>
        <Field label="Aval">
          <Input autoComplete="off" defaultValue={defaults?.aval} maxLength={250} name="aval" required />
        </Field>
        <Field label="Fecha de inicio">
          <Input defaultValue={defaults?.fechaInicio} name="fechaInicio" required type="date" />
        </Field>
        <Field label="Plazo (meses)">
          <Input defaultValue={defaults?.plazoMeses} max={1200} min={1} name="plazoMeses" required type="number" />
        </Field>
        <Field label="Fecha de finalización">
          <Input defaultValue={defaults?.fechaFin} name="fechaFin" required type="date" />
        </Field>
        <Field label="Día de pago">
          <Input defaultValue={defaults?.diaPago} max={31} min={1} name="diaPago" required type="number" />
        </Field>
        <Field label="Renta mensual base">
          <Input defaultValue={defaults?.rentaMensualBase} inputMode="decimal" name="rentaMensualBase" placeholder="0.00" required />
        </Field>
        <Field label="Depósito en garantía">
          <Input defaultValue={defaults?.depositoGarantia} inputMode="decimal" name="depositoGarantia" placeholder="0.00" required />
        </Field>
      </div>
    </FoundationForm>
  );
}
