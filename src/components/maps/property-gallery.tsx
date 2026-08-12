"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

export function PropertyGallery({ photos, title }: { photos: { id: string; url: string; nombre: string }[]; title: string }) {
  const [current, setCurrent] = useState(0);
  if (!photos.length) return <div className="flex aspect-[16/10] items-end rounded-2xl bg-[linear-gradient(145deg,#1e3a5f,#426583)] p-6 text-white"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-white/70">Galería del inmueble</p><p className="mt-2 font-serif text-xl font-semibold">Aún no hay fotos</p><p className="mt-1 text-sm text-white/80">Agrega imágenes desde Editar propiedad.</p></div></div>;
  const photo = photos[current];
  return <div className="overflow-hidden rounded-2xl bg-bg shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]"><div className="relative aspect-[16/10] bg-brand"><img alt={`${title} · foto ${current + 1}`} className="h-full w-full object-cover" src={photo.url} /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-12"><span className="text-xs font-bold text-white">{current + 1} / {photos.length}</span><div className="flex gap-2"><button aria-label="Foto anterior" className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-bold text-brand disabled:opacity-40" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} type="button">←</button><button aria-label="Foto siguiente" className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-bold text-brand disabled:opacity-40" disabled={current === photos.length - 1} onClick={() => setCurrent((value) => value + 1)} type="button">→</button></div></div></div><div className="flex gap-2 overflow-x-auto p-3">{photos.map((item, index) => <button aria-label={`Ver foto ${index + 1}`} className={index === current ? "h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-brand" : "h-14 w-20 shrink-0 overflow-hidden rounded-lg opacity-60 hover:opacity-100"} key={item.id} onClick={() => setCurrent(index)} type="button"><img alt="" className="h-full w-full object-cover" src={item.url} /></button>)}</div></div>;
}
