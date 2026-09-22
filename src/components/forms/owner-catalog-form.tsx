"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

type Propietario = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  _count: { propiedades: number; unidades: number; cuentas: number };
};

function optionalValue(form: FormData, field: string) {
  const value = String(form.get(field) ?? "").trim();
  return value || null;
}

function payloadFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    nombre: String(data.get("nombre") ?? ""),
    telefono: optionalValue(data, "telefono"),
    correo: optionalValue(data, "correo"),
  };
}

async function save(payload: unknown, method: "POST" | "PATCH" | "DELETE") {
  const response = await fetch("/api/configuracion/propietarios", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible guardar el propietario.");
}

export function OwnerCatalogForm({ propietarios }: { propietarios: Propietario[] }) {
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await save(payloadFromForm(event.currentTarget), "POST");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible crear el propietario.");
      setPending(false);
    }
  }

  async function update(id: string, form: HTMLFormElement) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await save({ id, ...payloadFromForm(form) }, "PATCH");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible actualizar el propietario.");
      setPending(false);
    }
  }

  async function remove(propietario: Propietario) {
    if (pending) return;
    if (!window.confirm(`¿Eliminar a ${propietario.nombre}? Esta acción no se puede deshacer.`)) return;
    setPending(true);
    setError(null);
    try {
      await save({ id: propietario.id }, "DELETE");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible eliminar el propietario.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg px-4 py-3 text-sm text-ink-secondary">
        <span><strong className="text-ink">{propietarios.length}</strong> propietarios registrados</span>
        <Button onClick={() => setCreating((value) => !value)} variant="secondary">
          {creating ? "Cerrar alta" : "Nuevo propietario"}
        </Button>
      </div>

      {creating ? (
        <form className="space-y-5 rounded-xl border border-brand/30 bg-bg/50 p-5" onSubmit={create}>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">Nuevo propietario</h2>
            <p className="mt-1 text-sm text-ink-secondary">Registra al titular antes de vincularle cuentas o inmuebles.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre o razón social"><Input maxLength={250} name="nombre" required /></Field>
            <Field hint="Opcional" label="Teléfono"><Input maxLength={20} name="telefono" type="tel" /></Field>
            <Field hint="Opcional" label="Correo electrónico"><Input className="sm:col-span-2" maxLength={254} name="correo" type="email" /></Field>
          </div>
          <Button disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar propietario"}</Button>
        </form>
      ) : null}

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-xl font-semibold text-ink">Catálogo de propietarios</h2>
          <p className="mt-1 text-sm text-ink-secondary">Las cuentas Propietario se vinculan a uno de estos registros.</p>
        </div>
        <div className="space-y-4">
          {propietarios.map((propietario) => (
            <form className="rounded-xl border border-border bg-surface p-4 sm:p-5" key={propietario.id} onSubmit={(event) => { event.preventDefault(); void update(propietario.id, event.currentTarget); }}>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nombre o razón social"><Input defaultValue={propietario.nombre} maxLength={250} name="nombre" required /></Field>
                <Field hint="Opcional" label="Teléfono"><Input defaultValue={propietario.telefono ?? ""} maxLength={20} name="telefono" type="tel" /></Field>
                <Field hint="Opcional" label="Correo electrónico"><Input defaultValue={propietario.correo ?? ""} maxLength={254} name="correo" type="email" /></Field>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-ink-secondary">{propietario._count.propiedades} propiedades · {propietario._count.unidades} unidades · {propietario._count.cuentas} cuentas vinculadas</p>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={pending} type="submit">Guardar cambios</Button>
                  <Button disabled={pending} onClick={() => void remove(propietario)} type="button" variant="danger">Eliminar</Button>
                </div>
              </div>
            </form>
          ))}
          {propietarios.length === 0 ? <p className="rounded-xl bg-bg p-5 text-sm text-ink-secondary">Aún no hay propietarios registrados.</p> : null}
        </div>
      </section>
    </div>
  );
}
