"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import type { UbicacionParaUnificar } from "@/lib/validation/property-merge";
import { Alert } from "@/components/ui/alert";

export function MergePropertyButton({ action, duplicatePropertyId, duplicateAddress, ubicacion, fromEditor = false }: {
  action: string;
  duplicatePropertyId: string;
  duplicateAddress?: string;
  fromEditor?: boolean;
  ubicacion?: UbicacionParaUnificar;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [open]);

  function close() {
    if (!inFlight.current) setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(undefined);
    try {
      const body = new FormData();
      body.set("propiedadDuplicadaId", duplicatePropertyId);
      if (ubicacion) {
        for (const [key, value] of Object.entries(ubicacion)) body.set(key, value ?? "");
      }
      const response = await fetch(action, { method: "POST", headers: { Accept: "application/json" }, body });
      const result = await response.json().catch(() => ({})) as { error?: string; redirectUrl?: string };
      if (!response.ok || !result.redirectUrl) throw new Error(result.error ?? "No fue posible completar la unificación. Revisa tu sesión e intenta de nuevo.");
      // Load the surviving record with fresh data, even if it is the current page.
      window.location.assign(result.redirectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la unificación.");
      inFlight.current = false;
      setPending(false);
    }
  }

  return <>
    <button className="cursor-pointer rounded border border-warning bg-warning-soft px-4 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/15" onClick={() => { setError(undefined); setOpen(true); }} type="button">Unificar fichas</button>
    {open ? createPortal(<dialog aria-describedby={`${labelId}-description`} aria-labelledby={`${labelId}-title`} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} ref={dialogRef}>
      <div className="p-6">
        <h2 className="font-serif text-2xl font-semibold text-ink" id={`${labelId}-title`}>¿Unificar estas propiedades?</h2>
        {duplicateAddress ? <p className="mt-3 rounded-lg bg-bg p-3 text-sm">Unificar la ficha actual con: <strong>{duplicateAddress}</strong></p> : null}
        <p className="mt-3 text-sm leading-6 text-ink-secondary" id={`${labelId}-description`}>Se conservará la ficha activa creada primero y sus valores generales. Las unidades, fotos e historial de la otra ficha se moverán a ella; después se eliminará la ficha duplicada. Cada unidad conservará su dueño y contratos.</p>
        {ubicacion ? <div className="mt-3 rounded-lg bg-bg p-3 text-sm"><p>Dirección que se guardará en la ficha unificada:</p><strong>{ubicacion.direccion}</strong><p className="mt-2">La dirección y ubicación se guardarán junto con la unificación. Los demás cambios pendientes del formulario no se incluirán.</p></div> : fromEditor ? <p className="mt-3 text-sm text-ink-secondary">Se usarán los datos guardados. Los cambios pendientes de este formulario no se guardarán al unificar.</p> : null}
        {error ? <Alert className="mt-4" variant="danger">{error}</Alert> : null}
        <form className="mt-6 flex flex-wrap justify-end gap-3" onSubmit={(event) => void submit(event)}>
          <button className="cursor-pointer rounded border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-60" disabled={pending} onClick={close} type="button">Cancelar</button>
          <button className="cursor-pointer rounded bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Unificando…" : ubicacion ? "Guardar ubicación y unificar" : "Confirmar unificación"}</button>
        </form>
      </div>
    </dialog>, document.body) : null}
  </>;
}
