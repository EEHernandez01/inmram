"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export function PropertyPhotoInput() {
  const [previews, setPreviews] = useState<string[]>([]);
  return <div><label className="block text-sm font-semibold text-ink"><span>Fotos del inmueble</span><input accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-ink-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand" multiple name="fotos" onChange={(event) => setPreviews(Array.from(event.target.files ?? []).map((file) => URL.createObjectURL(file)))} type="file" /></label><p className="mt-2 text-xs text-ink-secondary">JPG, PNG o WebP. Máximo 8 fotos de 5 MB.</p>{previews.length ? <div className="mt-4 grid grid-cols-3 gap-3">{previews.map((preview) => <img alt="Vista previa" className="aspect-square rounded-xl object-cover" key={preview} src={preview} />)}</div> : null}</div>;
}
