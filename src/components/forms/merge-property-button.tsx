"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function MergeSubmitButton() {
  const { pending } = useFormStatus();

  return <button className="cursor-pointer rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">{pending ? "Unificando…" : "Unificar propiedades"}</button>;
}

export function MergePropertyButton({
  action,
  duplicatePropertyId,
}: {
  action: string;
  duplicatePropertyId: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <>
    <button className="cursor-pointer rounded border border-warning bg-warning-soft px-4 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/15" onClick={() => setOpen(true)} type="button">Unificar fichas</button>
    <dialog aria-describedby="merge-property-description" aria-labelledby="merge-property-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45" onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} ref={dialogRef}>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-warning">Consolidación de datos</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink" id="merge-property-title">¿Unificar estas propiedades?</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary" id="merge-property-description">Se conservará la ficha activa creada primero. Las unidades, fotos e historial de la ficha creada después se moverán a ella, y la ficha duplicada se eliminará.</p>
        <form action={action} className="mt-6 flex flex-wrap justify-end gap-3" method="post">
          <input name="propiedadDuplicadaId" type="hidden" value={duplicatePropertyId} />
          <button className="cursor-pointer rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg" onClick={() => setOpen(false)} type="button">Cancelar</button>
          <MergeSubmitButton />
        </form>
      </div>
    </dialog>
  </>;
}
