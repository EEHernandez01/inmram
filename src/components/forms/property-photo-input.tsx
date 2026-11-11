"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type RefObject } from "react";

import { MAX_PROPERTY_PHOTOS } from "@/lib/property-photo-limits";

type ExistingPhoto = { id: string; nombre: string; url: string };

export function PropertyPhotoInput({ existingPhotos = [], inputRef, onFilesChange, removable = false }: { existingPhotos?: ExistingPhoto[]; inputRef?: RefObject<HTMLInputElement | null>; onFilesChange?: (files: File[]) => void; removable?: boolean }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const visiblePhotos = existingPhotos.filter((photo) => !removedPhotoIds.includes(photo.id));
  const availableSlots = Math.max(0, MAX_PROPERTY_PHOTOS - visiblePhotos.length);

  return <div className="space-y-4">
    {existingPhotos.length ? <div><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">Fotos actuales</p><span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{visiblePhotos.length} de {MAX_PROPERTY_PHOTOS}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{existingPhotos.map((photo) => {
      const removed = removedPhotoIds.includes(photo.id);
      return <div className="relative" key={photo.id}><img alt={photo.nombre || "Foto del inmueble"} className={`aspect-square w-full rounded-xl border border-border object-cover ${removed ? "opacity-30" : ""}`} src={photo.url} />{removable ? <button aria-label={removed ? `Conservar ${photo.nombre}` : `Eliminar ${photo.nombre}`} className="absolute right-2 top-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-danger shadow" onClick={() => setRemovedPhotoIds((ids) => removed ? ids.filter((id) => id !== photo.id) : [...ids, photo.id])} type="button">{removed ? "Conservar" : "Eliminar"}</button> : null}</div>;
    })}</div>{removedPhotoIds.map((id) => <input key={id} name="fotosEliminar" type="hidden" value={id} />)}</div> : null}
    {availableSlots > 0 ? <label className="block rounded-xl border border-dashed border-border bg-bg/50 p-4 text-sm text-ink"><span className="font-semibold">Agregar fotos</span><span className="mt-1 block text-xs text-ink-secondary">Puedes añadir hasta {availableSlots} {availableSlots === 1 ? "foto" : "fotos"} más. JPG, JPEG, PNG o WebP de máximo 10 MB. Se optimizarán y guardarán como WebP.</span><input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="mt-3 block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, availableSlots); setPreviews(files.map((file) => URL.createObjectURL(file))); onFilesChange?.(files); }} ref={inputRef} type="file" /></label> : <p className="rounded-xl bg-bg px-4 py-3 text-sm text-ink-secondary">Esta propiedad ya tiene el máximo de {MAX_PROPERTY_PHOTOS} fotos.</p>}
    {previews.length ? <div><p className="mb-3 text-sm font-semibold text-ink">Nuevas fotos</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{previews.map((preview) => <img alt="Vista previa de una foto nueva" className="aspect-square rounded-xl object-cover" key={preview} src={preview} />)}</div></div> : null}
  </div>;
}
