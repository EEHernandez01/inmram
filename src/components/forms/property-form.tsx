"use client";

import { useRef, useState, type FormEvent } from "react";

import { LocationPicker } from "@/components/forms/location-picker";
import { PropertyPhotoInput } from "@/components/forms/property-photo-input";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/ui/form-status";
import { MoneyInput } from "@/components/ui/money-input";

const defaultMoneyValue = "0.00";
const maxPhotoSize = 4 * 1024 * 1024;
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type PropertyDefaults = {
  propietarioId?: string;
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
type UploadedPhoto = { url: string; pathname: string; nombre: string; mimeType: string; tamanoBytes: number };

async function uploadPropertyPhoto(file: File): Promise<UploadedPhoto> {
  const body = new FormData();
  body.append("foto", file);
  const response = await fetch("/api/uploads/propiedades", { method: "POST", body });
  const payload = await response.json().catch(() => ({})) as UploadedPhoto & { error?: string };

  if (!response.ok) throw new Error(payload.error ?? "No fue posible cargar la foto.");
  return payload;
}

export function PropertyForm({ action = "/api/propiedades", defaults, existingPhotos, placesEnabled, submitLabel, owners }: {
  action?: string | ((formData: FormData) => Promise<void>);
  defaults?: PropertyDefaults;
  existingPhotos?: ExistingPhoto[];
  placesEnabled: boolean;
  submitLabel: string;
  owners?: { value: string; nombre: string; detalle: string }[];
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const preparedSubmit = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const transportProps = typeof action === "string"
    ? { encType: "multipart/form-data", method: "post" }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (preparedSubmit.current) {
      preparedSubmit.current = false;
      return;
    }

    const form = event.currentTarget;
    const files = Array.from(photoInputRef.current?.files ?? []);
    if (files.length === 0) return;

    event.preventDefault();
    setUploadError(undefined);
    const remainingSlots = 8 - (existingPhotos?.length ?? 0);
    if (files.length > remainingSlots) {
      setUploadError(`Puedes agregar hasta ${remainingSlots} fotos más.`);
      return;
    }
    if (files.some((file) => !allowedPhotoTypes.has(file.type) || file.size > maxPhotoSize)) {
      setUploadError("Cada foto debe ser JPG, PNG o WebP y pesar máximo 4 MB.");
      return;
    }

    setIsUploading(true);
    try {
      form.querySelectorAll('input[name="fotosBlob"], input[name="fotoCargaFallida"]').forEach((input) => input.remove());
      const results = await Promise.allSettled(files.map(uploadPropertyPhoto));

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const field = document.createElement("input");
        field.name = "fotosBlob";
        field.type = "hidden";
        field.value = JSON.stringify(result.value);
        form.append(field);
      }
      if (results.some((result) => result.status === "rejected")) {
        const warning = document.createElement("input");
        warning.name = "fotoCargaFallida";
        warning.type = "hidden";
        warning.value = "1";
        form.append(warning);
      }

      preparedSubmit.current = true;
      form.requestSubmit();
    } catch {
      setUploadError("No fue posible preparar las fotos. Inténtalo nuevamente.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={action} aria-busy={isUploading} className="space-y-6" onSubmit={handleSubmit} {...transportProps}>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Información de la propiedad</h2></div>{owners ? <div className="mb-5"><Field label="Propietario"><Select defaultValue={defaults?.propietarioId} name="propietarioId" required><option value="">Selecciona un propietario</option>{owners.map((owner) => <option key={owner.value} value={owner.value}>{owner.nombre}</option>)}</Select></Field></div> : null}<LocationPicker defaults={{ address: defaults?.direccion, googlePlaceId: defaults?.googlePlaceId, latitude: defaults?.latitud, longitude: defaults?.longitud }} enabled={placesEnabled} /></section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Valores y gastos anuales</h2><p className="mt-1 text-sm text-ink-secondary">Captura importes en pesos mexicanos.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field hint="Valor registrado para fines fiscales." label="Valor catastral"><MoneyInput defaultValue={defaults?.valorCatastral ?? defaultMoneyValue} name="valorCatastral" required /></Field><Field hint="Valor estimado total del inmueble." label="Valor comercial total"><MoneyInput defaultValue={defaults?.valorComercialTotal ?? defaultMoneyValue} name="valorComercialTotal" required /></Field><Field hint="Pago total estimado por año." label="Predial anual"><MoneyInput defaultValue={defaults?.predialAnual ?? defaultMoneyValue} name="predialAnual" required /></Field><Field hint="Cuotas y servicios comunes por año." label="Mantenimiento anual"><MoneyInput defaultValue={defaults?.mantenimientoAnual ?? defaultMoneyValue} name="mantenimientoAnual" required /></Field></div></section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Fotos</h2><p className="mt-1 text-sm text-ink-secondary">Una galería ayuda a identificar rápidamente el inmueble.</p></div><PropertyPhotoInput existingPhotos={existingPhotos} inputRef={photoInputRef} /></section>
      <FormStatus message={uploadError} />
      <div className="sticky bottom-3 flex items-center justify-end rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:justify-start sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Button disabled={isUploading} type="submit">{isUploading ? "Subiendo fotos…" : submitLabel}</Button></div>
    </form>
  );
}
