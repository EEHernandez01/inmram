"use client";

import { useState } from "react";

import { FormStatus } from "@/components/ui/form-status";
import { ContractTermFields } from "@/components/forms/contract-term-fields";
import { Field, Input, Select } from "@/components/ui/form-controls";

type ContractDefaults = {
  arrendatario: string;
  emailArrendatario?: string | null;
  telefonoArrendatario?: string | null;
  aval: string;
  tipoGarantia?: "AVAL" | "PRENDA" | "INMUEBLE";
  valorGarantia?: string | null;
  avalTelefono?: string | null;
  avalCorreo?: string | null;
  fechaInicio: string;
  plazoMeses: number;
  fechaFin: string;
  rentaMensualBase: string;
  diaPago: number;
  depositoGarantia: string;
  cargoFijoMensual?: string;
  estado: "ACTIVO" | "VENCIDO";
};

export function ContractForm({ cancelHref, defaults, propertyId, submitLabel, unitId, contractId }: {
  cancelHref: string;
  defaults?: ContractDefaults;
  propertyId: string;
  submitLabel: string;
  unitId: string;
  contractId?: string;
}) {
  const [guaranteeType, setGuaranteeType] = useState(defaults?.tipoGarantia ?? "AVAL");
  const action = contractId
    ? `/api/contratos/${contractId}`
    : `/api/propiedades/${propertyId}/unidades/${unitId}/contratos`;

  return (
    <form action={action} className="space-y-6" method="post">
      <input name="propiedadId" type="hidden" value={propertyId} />
      <input name="unidadId" type="hidden" value={unitId} />
      <input name="estado" type="hidden" value={defaults?.estado ?? "ACTIVO"} />
      <section className="rounded-2xl bg-bg p-5 shadow-[inset_3px_3px_7px_#c7cdd5,inset_-3px_-3px_7px_#fff]"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Parte contratante</p><h2 className="mt-1 font-serif text-xl font-semibold text-ink">Arrendatario</h2></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Nombre completo"><Input autoComplete="name" defaultValue={defaults?.arrendatario} maxLength={250} name="arrendatario" required /></Field><Field label="Correo electrónico"><Input autoComplete="email" defaultValue={defaults?.emailArrendatario ?? ""} maxLength={254} name="emailArrendatario" placeholder="Opcional" type="email" /></Field><Field label="Teléfono"><Input autoComplete="tel" defaultValue={defaults?.telefonoArrendatario ?? ""} maxLength={20} name="telefonoArrendatario" placeholder="Opcional" type="tel" /></Field></div></section>
      <section className="rounded-2xl bg-bg p-5 shadow-[inset_3px_3px_7px_#c7cdd5,inset_-3px_-3px_7px_#fff]"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Respaldo del contrato</p><h2 className="mt-1 font-serif text-xl font-semibold text-ink">Garantía</h2><p className="mt-1 text-sm text-ink-secondary">Indica el respaldo pactado para este contrato.</p></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Tipo de garantía"><Select name="tipoGarantia" onChange={(event) => setGuaranteeType(event.target.value as typeof guaranteeType)} value={guaranteeType}><option value="AVAL">Aval (persona)</option><option value="PRENDA">Prenda en garantía</option><option value="INMUEBLE">Inmueble en garantía</option></Select></Field><Field label={guaranteeType === "AVAL" ? "Nombre completo del aval" : guaranteeType === "PRENDA" ? "Descripción de la prenda" : "Descripción del inmueble"}><Input autoComplete="off" defaultValue={defaults?.aval} maxLength={250} name="aval" placeholder={guaranteeType === "PRENDA" ? "Ej. Vehículo, marca, modelo y placas" : guaranteeType === "INMUEBLE" ? "Ej. Dirección y datos de identificación" : "Nombre completo"} required /></Field>{guaranteeType === "PRENDA" ? <Field hint="Valor estimado al momento de firmar el contrato." label="Valuación de la prenda"><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">MX$</span><Input className="pl-11" defaultValue={defaults?.valorGarantia ?? ""} inputMode="decimal" name="valorGarantia" placeholder="0.00" required /></div></Field> : <input name="valorGarantia" type="hidden" value="" />}{guaranteeType === "AVAL" ? <><Field label="Teléfono"><Input autoComplete="tel" defaultValue={defaults?.avalTelefono ?? ""} maxLength={20} name="avalTelefono" placeholder="Opcional" type="tel" /></Field><Field label="Correo electrónico"><Input autoComplete="email" defaultValue={defaults?.avalCorreo ?? ""} maxLength={254} name="avalCorreo" placeholder="Opcional" type="email" /></Field></> : null}</div></section>
      <section className="rounded-2xl bg-bg p-5 shadow-[inset_3px_3px_7px_#c7cdd5,inset_-3px_-3px_7px_#fff]"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Vigencia y cobro</p><h2 className="mt-1 font-serif text-xl font-semibold text-ink">Condiciones del contrato</h2></div><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><ContractTermFields defaultEnd={defaults?.fechaFin} defaultPaymentDay={defaults?.diaPago} defaultStart={defaults?.fechaInicio} defaultTerm={defaults?.plazoMeses} /><Field label="Renta mensual base"><Input defaultValue={defaults?.rentaMensualBase} inputMode="decimal" name="rentaMensualBase" placeholder="0.00" required /></Field><Field label="Depósito en garantía"><Input defaultValue={defaults?.depositoGarantia} inputMode="decimal" name="depositoGarantia" placeholder="0.00" required /></Field><Field label="Servicios mensuales" hint="Incluye agua y otros servicios pactados."><Input defaultValue={defaults?.cargoFijoMensual ?? "0.00"} inputMode="decimal" name="cargoFijoMensual" placeholder="0.00" required /></Field></div></section>
      <FormStatus message={undefined} />
      <div className="flex flex-col-reverse gap-3 border-t border-brand/10 pt-6 sm:flex-row sm:items-center sm:justify-end"><a className="inline-flex justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-white/45 hover:text-ink" href={cancelHref}>Cancelar</a><button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_9px_#b8c2cd] hover:bg-brand-hover" type="submit">{submitLabel}</button></div>
    </form>
  );
}
