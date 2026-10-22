"use client";

import { useState } from "react";

type PrintableReceipt = { id: string; label: string };

export function ReceiptPrintControls({
  receipts,
  periodValue,
  status,
  search,
  total,
}: {
  receipts: PrintableReceipt[];
  periodValue: string;
  status?: string;
  search?: string;
  total: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = receipts.length > 0 && selected.size === receipts.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(receipts.map((receipt) => receipt.id)));
  }

  return (
    <form action="/api/cobranza/imprimir" className="flex flex-wrap items-center gap-2" method="post" target="_blank">
      <input name="periodo" type="hidden" value={periodValue} />
      {status ? <input name="estatus" type="hidden" value={status} /> : null}
      {search ? <input name="buscar" type="hidden" value={search} /> : null}
      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-card bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover" name="modo" type="submit" value="todos">
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2m-10-4h10v8H7z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
        Imprimir todos ({total})
      </button>
      <details className="relative">
        <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-card border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-bg [&::-webkit-details-marker]:hidden">
          Seleccionar recibos ({selected.size})
        </summary>
        <div className="absolute right-0 z-20 mt-2 max-h-[min(65vh,28rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-card border border-border bg-surface p-4 shadow-xl">
          <label className="flex cursor-pointer items-center gap-3 border-b border-border pb-3 text-sm font-semibold text-ink">
            <input checked={allSelected} className="size-4 accent-brand" onChange={toggleAll} type="checkbox" />
            Seleccionar los {receipts.length} de esta página
          </label>
          <div className="mt-2 space-y-1">
            {receipts.map((receipt) => <label className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 text-sm text-ink hover:bg-bg" key={receipt.id}>
              <input checked={selected.has(receipt.id)} className="mt-0.5 size-4 shrink-0 accent-brand" name="ids" onChange={() => toggle(receipt.id)} type="checkbox" value={receipt.id} />
              <span>{receipt.label}</span>
            </label>)}
          </div>
          <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-card bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50" disabled={selected.size === 0} name="modo" type="submit" value="seleccionados">
            Imprimir selección ({selected.size})
          </button>
        </div>
      </details>
    </form>
  );
}
