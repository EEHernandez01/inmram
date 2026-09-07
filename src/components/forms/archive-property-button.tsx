"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function ArchiveSubmitButton() {
  const { pending } = useFormStatus();

  return <button className="cursor-pointer rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">{pending ? "Archivando…" : "Eliminar propiedad"}</button>;
}

export function ArchivePropertyButton({
  action,
  className = "cursor-pointer text-sm font-semibold text-danger hover:text-danger/80",
}: {
  action: string;
  className?: string;
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
    <button className={className} onClick={() => setOpen(true)} type="button">Eliminar propiedad</button>
    <dialog aria-describedby="archive-property-description" aria-labelledby="archive-property-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45" onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} ref={dialogRef}>
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-danger">Acción irreversible</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink" id="archive-property-title">¿Eliminar propiedad?</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary" id="archive-property-description">La propiedad se archivará. Sus unidades, contratos, recibos, pagos, lecturas y archivos se conservarán, pero quedarán en modo solo consulta.</p>
        <form action={action} className="mt-6 flex flex-wrap justify-end gap-3" method="post">
          <button className="cursor-pointer rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg" onClick={() => setOpen(false)} type="button">Cancelar</button>
          <ArchiveSubmitButton />
        </form>
      </div>
    </dialog>
  </>;
}
