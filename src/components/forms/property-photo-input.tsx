"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type ExistingPhoto = { id: string; nombre: string; url: string };

export function PropertyPhotoInput({ existingPhotos = [] }: { existingPhotos?: ExistingPhoto[] }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const availableSlots = Math.max(0, 8 - existingPhotos.length);

  return <div className="space-y-4">
    {existingPhotos.length ? <div><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">Fotos actuales</p><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{existingPhotos.length} de 8</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{existingPhotos.map((photo) => <img alt={photo.nombre || "Foto del inmueble"} className="aspect-square rounded-xl border border-border object-cover" key={photo.id} src={photo.url} />)}</div></div> : null}
    {availableSlots > 0 ? <label className="block rounded-xl border border-dashed border-border bg-bg/50 p-4 text-sm text-ink"><span className="font-semibold">Agregar fotos</span><span className="mt-1 block text-xs text-ink-secondary">Puedes añadir hasta {availableSlots} {availableSlots === 1 ? "foto" : "fotos"} más. JPG, PNG o WebP de máximo 5 MB.</span><input accept="image/jpeg,image/png,image/webp" className="mt-3 block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand" multiple name="fotos" onChange={(event) => setPreviews(Array.from(event.target.files ?? []).slice(0, availableSlots).map((file) => URL.createObjectURL(file)))} type="file" /></label> : <p className="rounded-xl bg-bg px-4 py-3 text-sm text-ink-secondary">Esta propiedad ya tiene el máximo de 8 fotos.</p>}
    {previews.length ? <div><p className="mb-3 text-sm font-semibold text-ink">Nuevas fotos</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{previews.map((preview) => <img alt="Vista previa de una foto nueva" className="aspect-square rounded-xl object-cover" key={preview} src={preview} />)}</div></div> : null}
  </div>;
}
