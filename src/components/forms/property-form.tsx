"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { LocationPicker } from "@/components/forms/location-picker";
import { PropertyPhotoInput } from "@/components/forms/property-photo-input";
import { Alert } from "@/components/ui/alert";
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
type CoincidenciaPropiedad = {
  id: string;
  direccion: string;
  archivadaEn: string | null;
  unidades: number;
  criterios: ("DIRECCION" | "GOOGLE_PLACE")[];
};

async function uploadPropertyPhoto(file: File): Promise<UploadedPhoto> {
  const body = new FormData();
  body.append("foto", file);
  const response = await fetch("/api/uploads/propiedades", { method: "POST", body });
  const payload = await response.json().catch(() => ({})) as UploadedPhoto & { error?: string };

  if (!response.ok) throw new Error(payload.error ?? "No fue posible cargar la foto.");
  return payload;
}

export function PropertyForm({ action = "/api/propiedades", defaults, existingPhotos, placesEnabled, propertyId, submitLabel, owners }: {
  action?: string | ((formData: FormData) => Promise<void>);
  defaults?: PropertyDefaults;
  existingPhotos?: ExistingPhoto[];
  placesEnabled: boolean;
  propertyId?: string;
  submitLabel: string;
  owners?: { value: string; nombre: string; detalle: string }[];
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const preparedSubmit = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [duplicateError, setDuplicateError] = useState<string>();
  const [location, setLocation] = useState({ direccion: defaults?.direccion ?? "", googlePlaceId: defaults?.googlePlaceId ?? null as string | null });
  const [coincidencias, setCoincidencias] = useState<CoincidenciaPropiedad[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const transportProps = typeof action === "string"
    ? { encType: "multipart/form-data", method: "post" }
    : {};

  useEffect(() => {
    const address = location.direccion.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (address.length < 3) {
        setCoincidencias([]);
        setIsCheckingDuplicates(false);
        return;
      }

      setIsCheckingDuplicates(true);
      try {
        const params = new URLSearchParams({ direccion: address });
        if (location.googlePlaceId) params.set("googlePlaceId", location.googlePlaceId);
        if (propertyId) params.set("excluirPropiedadId", propertyId);
        const response = await fetch(`/api/propiedades/coincidencias?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No fue posible revisar propiedades similares.");
        const payload = await response.json() as { coincidencias?: CoincidenciaPropiedad[] };
        if (!controller.signal.aborted) setCoincidencias(payload.coincidencias ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setCoincidencias([]);
          setDuplicateError(error instanceof Error ? error.message : "No fue posible revisar propiedades similares.");
        }
      } finally {
        if (!controller.signal.aborted) setIsCheckingDuplicates(false);
      }
    }, address.length < 3 ? 0 : 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [location, propertyId]);

  function handleLocationChange(nextLocation: { direccion: string; googlePlaceId: string | null }) {
    setLocation(nextLocation);
    setDuplicateConfirmed(false);
    setDuplicateError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (preparedSubmit.current) {
      preparedSubmit.current = false;
      return;
    }

    if (isCheckingDuplicates) {
      event.preventDefault();
      setDuplicateError("Estamos revisando si ya existe esta propiedad. Intenta guardar de nuevo en un momento.");
      return;
    }
    if (coincidencias.length > 0 && !duplicateConfirmed) {
      event.preventDefault();
      setDuplicateError("Confirma que se trata de un inmueble distinto o abre la ficha existente para agregar una unidad.");
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
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Información de la propiedad</h2></div>{owners ? <div className="mb-5"><Field label="Propietario"><Select defaultValue={defaults?.propietarioId} name="propietarioId" required><option value="">Selecciona un propietario</option>{owners.map((owner) => <option key={owner.value} value={owner.value}>{owner.nombre}</option>)}</Select></Field></div> : null}<LocationPicker defaults={{ address: defaults?.direccion, googlePlaceId: defaults?.googlePlaceId, latitude: defaults?.latitud, longitude: defaults?.longitud }} enabled={placesEnabled} onLocationChange={handleLocationChange} />{coincidencias.length > 0 ? <Alert className="mt-5" variant="warning"><p className="font-semibold">Ya hay {coincidencias.length === 1 ? "una propiedad" : "propiedades"} con esta dirección o ubicación.</p><ul className="mt-2 space-y-1">{coincidencias.map((property) => <li key={property.id}><Link className="font-semibold underline" href={`/propiedades/${property.id}`}>{property.direccion}</Link> · {property.unidades} {property.unidades === 1 ? "unidad" : "unidades"}{property.archivadaEn ? " · Archivada" : ""}</li>)}</ul><p className="mt-3">Para registrar otro espacio, abre la ficha existente y selecciona <strong>Nueva unidad</strong>.</p><label className="mt-3 flex items-start gap-2"><input checked={duplicateConfirmed} className="mt-1" name="confirmarDuplicado" onChange={(event) => setDuplicateConfirmed(event.target.checked)} type="checkbox" value="1" /><span>Confirmo que es un inmueble distinto y deseo crear otra ficha.</span></label></Alert> : <input name="confirmarDuplicado" type="hidden" value="" />}</section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Valores y gastos anuales</h2><p className="mt-1 text-sm text-ink-secondary">Captura importes en pesos mexicanos.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field hint="Valor registrado para fines fiscales." label="Valor catastral"><MoneyInput defaultValue={defaults?.valorCatastral ?? defaultMoneyValue} name="valorCatastral" required /></Field><Field hint="Valor estimado total del inmueble." label="Valor comercial total"><MoneyInput defaultValue={defaults?.valorComercialTotal ?? defaultMoneyValue} name="valorComercialTotal" required /></Field><Field hint="Pago total estimado por año." label="Predial anual"><MoneyInput defaultValue={defaults?.predialAnual ?? defaultMoneyValue} name="predialAnual" required /></Field><Field hint="Cuotas y servicios comunes por año." label="Mantenimiento anual"><MoneyInput defaultValue={defaults?.mantenimientoAnual ?? defaultMoneyValue} name="mantenimientoAnual" required /></Field></div></section>
      <section className="rounded-xl border border-border p-4 sm:p-5"><div className="mb-5"><h2 className="font-serif text-lg font-semibold text-ink">Fotos</h2><p className="mt-1 text-sm text-ink-secondary">Una galería ayuda a identificar rápidamente el inmueble.</p></div><PropertyPhotoInput existingPhotos={existingPhotos} inputRef={photoInputRef} /></section>
      <FormStatus message={duplicateError ?? uploadError} />
      <div className="sticky bottom-3 flex items-center justify-end rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:justify-start sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Button disabled={isUploading || isCheckingDuplicates} type="submit">{isUploading ? "Subiendo fotos…" : isCheckingDuplicates ? "Revisando propiedad…" : submitLabel}</Button></div>
    </form>
  );
}
