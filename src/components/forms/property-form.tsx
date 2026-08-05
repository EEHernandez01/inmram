import type { FoundationActionState } from "@/app/_actions/foundation";
import { FoundationForm } from "@/components/forms/foundation-form";
import { LocationPicker } from "@/components/forms/location-picker";
import { Field, Input } from "@/components/ui/form-controls";
type PropertyDefaults = {
  direccion: string;
  googlePlaceId?: string;
  latitud?: string;
  longitud?: string;
  valorCatastral: string;
  valorComercialTotal: string;
  predialAnual: string;
  mantenimientoAnual: string;
};

export function PropertyForm({ action, defaults, placesEnabled, submitLabel }: {
  action: (state: FoundationActionState | undefined, formData: FormData) => Promise<FoundationActionState | undefined>;
  defaults?: PropertyDefaults;
  placesEnabled: boolean;
  submitLabel: string;
}) {
  return (
    <FoundationForm action={action} submitLabel={submitLabel}>
      <div className="grid gap-5 sm:grid-cols-2">
        <LocationPicker defaults={{ address: defaults?.direccion, googlePlaceId: defaults?.googlePlaceId, latitude: defaults?.latitud, longitude: defaults?.longitud }} enabled={placesEnabled} />
        <Field label="Valor catastral">
          <Input defaultValue={defaults?.valorCatastral} inputMode="decimal" name="valorCatastral" placeholder="0.00" required />
        </Field>
        <Field label="Valor comercial total">
          <Input defaultValue={defaults?.valorComercialTotal} inputMode="decimal" name="valorComercialTotal" placeholder="0.00" required />
        </Field>
        <Field label="Predial anual">
          <Input defaultValue={defaults?.predialAnual} inputMode="decimal" name="predialAnual" placeholder="0.00" required />
        </Field>
        <Field label="Mantenimiento anual">
          <Input defaultValue={defaults?.mantenimientoAnual} inputMode="decimal" name="mantenimientoAnual" placeholder="0.00" required />
        </Field>
      </div>
    </FoundationForm>
  );
}
