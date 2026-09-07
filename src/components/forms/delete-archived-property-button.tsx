"use client";

import { useEffect, useRef, useState } from "react";

export function DeleteArchivedPropertyButton({ action }: { action: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <>
    <button className="cursor-pointer rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90" onClick={() => setOpen(true)} type="button">Eliminar permanentemente</button>
    <dialog aria-describedby="delete-property-description" aria-labelledby="delete-property-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45" onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} ref={dialogRef}>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-danger">Eliminación definitiva</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink" id="delete-property-title">¿Eliminar permanentemente?</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary" id="delete-property-description">Se borrarán definitivamente la propiedad, sus unidades, contratos, recibos, pagos, lecturas y archivos. Esta acción no se puede deshacer.</p>
        <form action={action} className="mt-6 flex flex-wrap justify-end gap-3" method="post">
          <button className="cursor-pointer rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg" onClick={() => setOpen(false)} type="button">Cancelar</button>
          <button className="cursor-pointer rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90" type="submit">Eliminar permanentemente</button>
        </form>
      </div>
    </dialog>
  </>;
}
