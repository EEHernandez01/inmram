import { LocationPicker } from "@/components/forms/location-picker";
import { FormStatus } from "@/components/ui/form-status";
import { Field, Input } from "@/components/ui/form-controls";
import { PropertyPhotoInput } from "@/components/forms/property-photo-input";

const defaultMoneyValue = "0.00";

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

export function PropertyForm({ action = "/api/propiedades", defaults, placesEnabled, submitLabel }: {
  action?: string | ((formData: FormData) => Promise<void>);
  defaults?: PropertyDefaults;
  placesEnabled: boolean;
  submitLabel: string;
}) {
  const transportProps = typeof action === "string"
    ? { encType: "multipart/form-data", method: "post" }
    : {};

  return (
    <form action={action} className="space-y-5" {...transportProps}>
      <div className="grid gap-5 sm:grid-cols-2">
        <LocationPicker defaults={{ address: defaults?.direccion, googlePlaceId: defaults?.googlePlaceId, latitude: defaults?.latitud, longitude: defaults?.longitud }} enabled={placesEnabled} />
        <Field label="Valor catastral">
          <Input defaultValue={defaults?.valorCatastral ?? defaultMoneyValue} inputMode="decimal" name="valorCatastral" placeholder="0.00" required />
        </Field>
        <Field label="Valor comercial total">
          <Input defaultValue={defaults?.valorComercialTotal ?? defaultMoneyValue} inputMode="decimal" name="valorComercialTotal" placeholder="0.00" required />
        </Field>
        <Field label="Predial anual">
          <Input defaultValue={defaults?.predialAnual ?? defaultMoneyValue} inputMode="decimal" name="predialAnual" placeholder="0.00" required />
        </Field>
        <Field label="Mantenimiento anual">
          <Input defaultValue={defaults?.mantenimientoAnual ?? defaultMoneyValue} inputMode="decimal" name="mantenimientoAnual" placeholder="0.00" required />
        </Field>
      </div>
      <PropertyPhotoInput />
      <FormStatus message={undefined} />
      <button className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
