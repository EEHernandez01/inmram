import { LocationPicker } from "@/components/forms/location-picker";
import { FormStatus } from "@/components/ui/form-status";
import { Field, Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
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

type ExistingPhoto = { id: string; nombre: string; url: string };

export function PropertyForm({ action = "/api/propiedades", defaults, existingPhotos, placesEnabled, submitLabel }: {
  action?: string | ((formData: FormData) => Promise<void>);
  defaults?: PropertyDefaults;
  existingPhotos?: ExistingPhoto[];
  placesEnabled: boolean;
  submitLabel: string;
}) {
  const transportProps = typeof action === "string"
    ? { encType: "multipart/form-data", method: "post" }
    : {};

  return (
    <form action={action} className="space-y-6" {...transportProps}>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Ubicación</h2><p className="mt-1 text-sm text-ink-secondary">Busca la dirección o completa sus datos manualmente.</p></div><LocationPicker defaults={{ address: defaults?.direccion, googlePlaceId: defaults?.googlePlaceId, latitude: defaults?.latitud, longitude: defaults?.longitud }} enabled={placesEnabled} /></section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Valores y gastos anuales</h2><p className="mt-1 text-sm text-ink-secondary">Captura importes en pesos mexicanos.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field hint="Valor registrado para fines fiscales." label="Valor catastral"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">MX$</span><Input className="pl-11" defaultValue={defaults?.valorCatastral ?? defaultMoneyValue} inputMode="decimal" name="valorCatastral" placeholder="0.00" required /></div></Field><Field hint="Valor estimado total del inmueble." label="Valor comercial total"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">MX$</span><Input className="pl-11" defaultValue={defaults?.valorComercialTotal ?? defaultMoneyValue} inputMode="decimal" name="valorComercialTotal" placeholder="0.00" required /></div></Field><Field hint="Pago total estimado por año." label="Predial anual"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">MX$</span><Input className="pl-11" defaultValue={defaults?.predialAnual ?? defaultMoneyValue} inputMode="decimal" name="predialAnual" placeholder="0.00" required /></div></Field><Field hint="Cuotas y servicios comunes por año." label="Mantenimiento anual"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">MX$</span><Input className="pl-11" defaultValue={defaults?.mantenimientoAnual ?? defaultMoneyValue} inputMode="decimal" name="mantenimientoAnual" placeholder="0.00" required /></div></Field></div></section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Fotos</h2><p className="mt-1 text-sm text-ink-secondary">Una galería ayuda a identificar rápidamente el inmueble.</p></div><PropertyPhotoInput existingPhotos={existingPhotos} /></section>
      <FormStatus message={undefined} />
      <div className="sticky bottom-3 flex items-center justify-end rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:justify-start sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Button type="submit">
        {submitLabel}
      </Button></div>
    </form>
  );
}
