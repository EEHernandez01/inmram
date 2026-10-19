"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LocationPicker } from "@/components/forms/location-picker";
import { PropertyPhotoInput } from "@/components/forms/property-photo-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { MoneyInput } from "@/components/ui/money-input";
import { unitAmenities } from "@/lib/unit-amenities";

const defaultMoneyValue = "0.00";
const maxPhotoSize = 4 * 1024 * 1024;
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const steps = [
  ["Propiedad", "Ubicación y propietario"],
  ["Valores y fotos", "Información financiera"],
  ["Unidades", "Inventario y contratos"],
  ["Revisar", "Confirmar el alta"],
] as const;

type OwnerOption = { value: string; nombre: string; detalle: string };
type OwnerReference =
  | { modo: "EXISTENTE"; propietarioId: string }
  | { modo: "NUEVO"; propietario: OwnerDraft };
type UnitOwnerReference = OwnerReference;
type OwnerDraft = { nombre: string; telefono: string; correo: string };
type PropertyDraft = {
  marcaId: string | null;
  direccion: string;
  googlePlaceId: string | null;
  latitud: string | null;
  longitud: string | null;
  valorCatastral: string;
  valorComercialTotal: string;
  predialAnual: string;
  mantenimientoAnual: string;
  confirmarDuplicado: boolean;
};
type ContractDraft = {
  arrendatario: string;
  emailArrendatario: string;
  telefonoArrendatario: string;
  aval: string;
  tipoGarantia: "AVAL" | "PRENDA" | "INMUEBLE" | "PAGARE";
  valorGarantia: string;
  pagareMonto: string;
  pagareFechaEmision: string;
  pagareFechaVencimiento: string;
  pagareLugarPago: string;
  avalTelefono: string;
  avalCorreo: string;
  fechaInicio: string;
  plazoMeses: string;
  fechaFin: string;
  fechaProximoCobro: string;
  periodicidadCobro: "MENSUAL" | "BIMESTRAL" | "SEMESTRAL" | "ANUAL";
  rentaMensualBase: string;
  diaPago: string;
  depositoGarantia: string;
};
type UnitDraft = {
  id: string;
  propietario: UnitOwnerReference;
  identificador: string;
  tipo: string;
  metrosCuadrados: string;
  descripcion: string;
  piso: string;
  recamaras: string;
  banosCompletos: string;
  mediosBanos: string;
  amenidades: string[];
  atributos: Record<string, string>;
  contrato: ContractDraft | null;
};
type Duplicate = { id: string; direccion: string; archivadaEn: string | null; unidades: number };
type UploadedPhoto = { url: string; pathname: string; nombre: string; mimeType: string; tamanoBytes: number };

const emptyOwner = (): OwnerDraft => ({ nombre: "", telefono: "", correo: "" });
const emptyContract = (): ContractDraft => ({
  arrendatario: "",
  emailArrendatario: "",
  telefonoArrendatario: "",
  aval: "",
  tipoGarantia: "AVAL",
  valorGarantia: "",
  pagareMonto: "",
  pagareFechaEmision: "",
  pagareFechaVencimiento: "",
  pagareLugarPago: "",
  avalTelefono: "",
  avalCorreo: "",
  fechaInicio: "",
  plazoMeses: "",
  fechaFin: "",
  fechaProximoCobro: "",
  periodicidadCobro: "MENSUAL",
  rentaMensualBase: "",
  diaPago: "",
  depositoGarantia: "",
});

const emptyUnit = (): UnitDraft => ({
  id: crypto.randomUUID(),
  propietario: { modo: "EXISTENTE", propietarioId: "" },
  identificador: "",
  tipo: "",
  metrosCuadrados: "",
  descripcion: "",
  piso: "",
  recamaras: "0",
  banosCompletos: "0",
  mediosBanos: "0",
  amenidades: [],
  atributos: {},
  contrato: null,
});

function calculatedEndDate(start: string, term: string, paymentDay: string) {
  const months = Number(term);
  const dueDay = Number(paymentDay);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isInteger(months) || months < 1 || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return "";

  const [year, month] = start.split("-").map(Number);
  const endMonth = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const paymentDate = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth(), Math.min(dueDay, lastDay)));
  paymentDate.setUTCDate(paymentDate.getUTCDate() - 1);
  return paymentDate.toISOString().slice(0, 10);
}

function suggestedNextCollection(start: string, paymentDay: string) {
  const day = Number(paymentDay);
  if (!Number.isInteger(day) || day < 1 || day > 31) return "";
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const todayValue = new Date(Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day)));
  const [year, month, date] = start.split("-").map(Number);
  const startValue = start ? new Date(Date.UTC(year, month - 1, date)) : todayValue;
  const base = startValue > todayValue ? startValue : todayValue;
  let dueYear = base.getFullYear(); let dueMonth = base.getMonth();
  if (day < base.getDate()) { dueMonth += 1; if (dueMonth > 11) { dueMonth = 0; dueYear += 1; } }
  const due = new Date(Date.UTC(dueYear, dueMonth, Math.min(day, new Date(Date.UTC(dueYear, dueMonth + 1, 0)).getUTCDate())));
  return due.toISOString().slice(0, 10);
}

async function uploadPropertyPhoto(file: File): Promise<UploadedPhoto> {
  const body = new FormData();
  body.append("foto", file);
  const response = await fetch("/api/uploads/propiedades", { method: "POST", body });
  const payload = await response.json().catch(() => ({})) as UploadedPhoto & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "No fue posible cargar la foto.");
  return payload;
}

function ownerName(reference: UnitOwnerReference, owners: OwnerOption[]) {
  if (reference.modo === "NUEVO") return reference.propietario.nombre.trim() || "Propietario nuevo";
  return owners.find((owner) => owner.value === reference.propietarioId)?.nombre ?? "Propietario seleccionado";
}

function NewOwnerFields({ owner, onChange }: { owner: OwnerDraft; onChange: (owner: OwnerDraft) => void }) {
  function update(field: keyof OwnerDraft, value: string) {
    onChange({ ...owner, [field]: value });
  }

  return <div className="mt-4 grid gap-4 rounded-xl border border-brand/15 bg-brand-soft/30 p-4 sm:grid-cols-2">
    <Field label="Nombre o razón social"><Input autoComplete="name" maxLength={250} onChange={(event) => update("nombre", event.target.value)} required value={owner.nombre} /></Field>
    <Field label="Teléfono"><Input autoComplete="tel" maxLength={20} onChange={(event) => update("telefono", event.target.value)} placeholder="Opcional" type="tel" value={owner.telefono} /></Field>
    <div className="sm:col-span-2"><Field label="Correo electrónico"><Input autoComplete="email" maxLength={254} onChange={(event) => update("correo", event.target.value)} placeholder="Opcional" type="email" value={owner.correo} /></Field></div>
  </div>;
}

function OwnerSelector({ label, owners, value, onChange }: {
  label: string;
  owners: OwnerOption[];
  value: OwnerReference;
  onChange: (value: OwnerReference) => void;
}) {
  function selectOwner(value: string) {
    if (value === "__NUEVO__") {
      onChange({ modo: "NUEVO", propietario: emptyOwner() });
      return;
    }
    onChange({ modo: "EXISTENTE", propietarioId: value });
  }

  return <div>
    <Field label={label}>
      <Select onChange={(event) => selectOwner(event.target.value)} required value={value.modo === "NUEVO" ? "__NUEVO__" : value.propietarioId}>
        <option value="">Selecciona un propietario</option>
        {owners.map((owner) => <option key={owner.value} value={owner.value}>{owner.nombre}{owner.detalle ? ` · ${owner.detalle}` : ""}</option>)}
        <option value="__NUEVO__">+ Registrar nuevo propietario</option>
      </Select>
    </Field>
    {value.modo === "NUEVO" ? <NewOwnerFields onChange={(propietario) => onChange({ modo: "NUEVO", propietario })} owner={value.propietario} /> : null}
  </div>;
}

export function PropertyOnboardingWizard({ owners, placesEnabled }: { owners: OwnerOption[]; placesEnabled: boolean }) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [property, setProperty] = useState<PropertyDraft>({
    marcaId: null,
    direccion: "",
    googlePlaceId: null,
    latitud: null,
    longitud: null,
    valorCatastral: defaultMoneyValue,
    valorComercialTotal: defaultMoneyValue,
    predialAnual: defaultMoneyValue,
    mantenimientoAnual: defaultMoneyValue,
    confirmarDuplicado: false,
  });
  const [propertyOwner, setPropertyOwner] = useState<OwnerReference>({ modo: "EXISTENTE", propietarioId: "" });
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [existingProperty, setExistingProperty] = useState<Duplicate | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const address = property.direccion.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (address.length < 3) {
        setDuplicates([]);
        setCheckingDuplicates(false);
        return;
      }

      setCheckingDuplicates(true);
      try {
        const params = new URLSearchParams({ direccion: address });
        if (property.googlePlaceId) params.set("googlePlaceId", property.googlePlaceId);
        const response = await fetch(`/api/propiedades/coincidencias?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No fue posible revisar propiedades similares.");
        const payload = await response.json() as { coincidencias?: Duplicate[] };
        if (!controller.signal.aborted) setDuplicates(payload.coincidencias ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setDuplicates([]);
          setMessage(error instanceof Error ? error.message : "No fue posible revisar propiedades similares.");
        }
      } finally {
        if (!controller.signal.aborted) setCheckingDuplicates(false);
      }
    }, address.length < 3 ? 0 : 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [property.direccion, property.googlePlaceId]);

  function updateProperty(field: keyof PropertyDraft, value: string | boolean | null) {
    setProperty((current) => ({ ...current, [field]: value }));
  }

  function updateUnit(unitId: string, update: (unit: UnitDraft) => UnitDraft) {
    setUnits((current) => current.map((unit) => unit.id === unitId ? update(unit) : unit));
  }

  function updateUnitField(unitId: string, field: keyof Pick<UnitDraft, "identificador" | "tipo" | "metrosCuadrados" | "descripcion" | "piso" | "recamaras" | "banosCompletos" | "mediosBanos">, value: string) {
    updateUnit(unitId, (unit) => ({ ...unit, [field]: value }));
  }

  function updateContract(unitId: string, update: (contract: ContractDraft) => ContractDraft) {
    updateUnit(unitId, (unit) => unit.contrato ? { ...unit, contrato: update(unit.contrato) } : unit);
  }

  function toggleAmenity(unitId: string, amenity: string, checked: boolean) {
    updateUnit(unitId, (unit) => {
      const amenidades = checked ? [...unit.amenidades, amenity] : unit.amenidades.filter((item) => item !== amenity);
      const atributos = { ...unit.atributos };
      if (!checked) {
        if (amenity === "Roof garden") delete atributos.roofGardenMetrosCuadrados;
        if (amenity === "Balcón") delete atributos.balconMetrosCuadrados;
        if (amenity === "Estacionamiento") delete atributos.cajonesEstacionamiento;
      }
      return { ...unit, amenidades, atributos };
    });
  }

  function validateOwner(owner: OwnerReference | UnitOwnerReference, label: string) {
    if (owner.modo === "EXISTENTE" && !owner.propietarioId) return `Selecciona ${label.toLocaleLowerCase("es-MX")}.`;
    if (owner.modo === "NUEVO" && !owner.propietario.nombre.trim()) return `Captura el nombre de ${label.toLocaleLowerCase("es-MX")}.`;
    return undefined;
  }

  function validationForStep(targetStep: number) {
    if (targetStep === 0) {
      return (existingProperty ? undefined : validateOwner(propertyOwner, "el propietario principal"))
        ?? (!property.direccion.trim() ? "Captura la dirección de la propiedad." : undefined)
        ?? (checkingDuplicates ? "Estamos revisando si ya existe esta propiedad. Inténtalo nuevamente en un momento." : undefined)
        ?? (duplicates.length > 0 && !existingProperty && !property.confirmarDuplicado ? "Selecciona la propiedad para agregar unidades o confirma que es un inmueble distinto." : undefined);
    }

    if (targetStep === 1) {
      if (existingProperty) return undefined;
      return [property.valorCatastral, property.valorComercialTotal, property.predialAnual, property.mantenimientoAnual].some((value) => !value.trim())
        ? "Captura los cuatro valores y gastos anuales."
        : undefined;
    }

    if (targetStep === 2) {
      if (existingProperty && units.length === 0) return "Agrega al menos una unidad a la propiedad existente.";
      const identifiers = new Set<string>();
      for (const unit of units) {
        const ownerError = validateOwner(unit.propietario, `el dueño de la unidad ${unit.identificador || "nueva"}`);
        if (ownerError) return ownerError;
        if (!unit.identificador.trim() || !unit.tipo || !unit.metrosCuadrados.trim()) return "Completa identificador, tipo y superficie de cada unidad.";
        const normalizedIdentifier = unit.identificador.trim().toLocaleLowerCase("es-MX");
        if (identifiers.has(normalizedIdentifier)) return "Cada unidad debe tener un identificador distinto.";
        identifiers.add(normalizedIdentifier);
        if (unit.amenidades.includes("Roof garden") && !unit.atributos.roofGardenMetrosCuadrados?.trim()) return `Captura los metros cuadrados de roof garden para la unidad ${unit.identificador}.`;
        if (unit.amenidades.includes("Balcón") && !unit.atributos.balconMetrosCuadrados?.trim()) return `Captura los metros cuadrados de balcón para la unidad ${unit.identificador}.`;
        if (unit.amenidades.includes("Estacionamiento") && !unit.atributos.cajonesEstacionamiento?.trim()) return `Captura los cajones de estacionamiento para la unidad ${unit.identificador}.`;
        if (!unit.contrato) continue;
        const contract = unit.contrato;
        if (!contract.arrendatario.trim() || !contract.aval.trim() || !contract.fechaInicio || !contract.plazoMeses || !contract.fechaFin || !contract.fechaProximoCobro || !contract.rentaMensualBase.trim() || !contract.diaPago || !contract.depositoGarantia.trim()) return `Completa los datos obligatorios del contrato de la unidad ${unit.identificador}.`;
        if (contract.tipoGarantia === "PRENDA" && !contract.valorGarantia.trim()) return `Captura la valuación de la prenda para la unidad ${unit.identificador}.`;
        if (contract.tipoGarantia === "PAGARE" && (!contract.pagareMonto.trim() || !contract.pagareFechaEmision || !contract.pagareFechaVencimiento || !contract.pagareLugarPago.trim())) return `Completa los datos del pagaré para la unidad ${unit.identificador}.`;
      }
    }

    return undefined;
  }

  function goTo(nextStep: number) {
    if (existingProperty && nextStep === 1) nextStep = step === 0 ? 2 : 0;
    if (nextStep > step) {
      const error = validationForStep(step);
      if (error) {
        setMessage(error);
        return;
      }
    }
    setMessage(undefined);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    for (const targetStep of [0, 1, 2]) {
      const error = validationForStep(targetStep);
      if (error) {
        setMessage(error);
        setStep(targetStep);
        return;
      }
    }

    const files = existingProperty ? [] : Array.from(photoInputRef.current?.files ?? []);
    if (files.length > 8) {
      setMessage("Puedes agregar hasta 8 fotos.");
      setStep(1);
      return;
    }
    if (files.some((file) => !allowedPhotoTypes.has(file.type) || file.size > maxPhotoSize)) {
      setMessage("Cada foto debe ser JPG, PNG o WebP y pesar máximo 4 MB.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setMessage(undefined);
    try {
      const uploads = await Promise.allSettled(files.map(uploadPropertyPhoto));
      const successfulUploads = uploads.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      const uploadFailed = uploads.some((result) => result.status === "rejected");
      const form = new FormData();
      form.append("alta", JSON.stringify({ ...(existingProperty ? { propiedadExistenteId: existingProperty.id } : { propietario: propertyOwner }), propiedad: property, unidades: units.map((unit) => ({ datos: {
        identificador: unit.identificador,
        tipo: unit.tipo,
        metrosCuadrados: unit.metrosCuadrados,
        descripcion: unit.descripcion || null,
        piso: unit.piso || null,
        recamaras: Number(unit.recamaras || 0),
        banosCompletos: Number(unit.banosCompletos || 0),
        mediosBanos: Number(unit.mediosBanos || 0),
        amenidades: unit.amenidades,
        atributos: Object.keys(unit.atributos).length ? unit.atributos : null,
      }, propietario: unit.propietario, contrato: unit.contrato ? {
        ...unit.contrato,
        emailArrendatario: unit.contrato.emailArrendatario || null,
        telefonoArrendatario: unit.contrato.telefonoArrendatario || null,
        valorGarantia: unit.contrato.valorGarantia || null,
        pagareMonto: unit.contrato.pagareMonto || null,
        pagareFechaEmision: unit.contrato.pagareFechaEmision || null,
        pagareFechaVencimiento: unit.contrato.pagareFechaVencimiento || null,
        pagareLugarPago: unit.contrato.pagareLugarPago || null,
        avalTelefono: unit.contrato.avalTelefono || null,
        avalCorreo: unit.contrato.avalCorreo || null,
      } : null })) }));
      successfulUploads.forEach((upload) => form.append("fotosBlob", JSON.stringify(upload)));

      const response = await fetch("/api/propiedades/asistente", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({})) as { propiedadId?: string; error?: string };
      if (!response.ok || !payload.propiedadId) {
        setMessage(payload.error ?? "No fue posible completar el alta de la propiedad.");
        return;
      }

      const warning = uploadFailed ? "La propiedad se guardó, pero una o más fotos no pudieron cargarse. Inténtalo nuevamente desde Editar propiedad." : "";
      router.push(`/propiedades/${payload.propiedadId}${warning ? `?aviso=${encodeURIComponent(warning)}` : ""}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible completar el alta de la propiedad.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmCancel(event: React.MouseEvent<HTMLAnchorElement>) {
    const hasWork = property.direccion.trim() || units.length > 0 || propertyOwner.modo === "NUEVO" || (propertyOwner.modo === "EXISTENTE" && propertyOwner.propietarioId);
    if (hasWork && !window.confirm("Se descartarán los datos capturados. ¿Deseas cancelar el asistente?")) event.preventDefault();
  }

  return <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    <ol aria-label="Progreso del asistente" className="grid gap-3 sm:grid-cols-4">
      {steps.map(([title, description], index) => <li key={title}><button className={`w-full rounded-xl border p-3 text-left transition ${index === step ? "border-brand bg-brand-soft text-ink" : index < step ? "border-success/40 bg-success-soft/40 text-ink" : "border-border bg-bg text-ink-secondary"}`} disabled={index > step || submitting || Boolean(existingProperty && index === 1)} onClick={() => goTo(index)} type="button"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index <= step ? "bg-brand text-white" : "bg-surface text-ink-secondary"}`}>{index < step ? "✓" : index + 1}</span>{title}</span><span className="mt-1 block text-xs font-normal">{existingProperty && index === 1 ? "Se conservan los datos existentes" : description}</span></button></li>)}
    </ol>

    {message ? <Alert variant="danger">{message}</Alert> : null}

    {step === 0 ? <section className="space-y-6 rounded-xl border border-border p-4 sm:p-5">
      <div><h2 className="font-serif text-xl font-semibold text-ink">¿De quién y dónde es el inmueble?</h2><p className="mt-1 text-sm text-ink-secondary">Comienza con la ubicación y el responsable principal de la propiedad.</p></div>
      {existingProperty ? <Alert variant="info">Se agregarán las unidades a la ficha seleccionada, conservando su propietario, valores y fotos.</Alert> : <OwnerSelector label="Propietario del inmueble" onChange={setPropertyOwner} owners={owners} value={propertyOwner} />}
      <div className="border-t border-border pt-6"><LocationPicker defaults={{ address: property.direccion, googlePlaceId: property.googlePlaceId ?? undefined, latitude: property.latitud ?? undefined, longitude: property.longitud ?? undefined }} enabled={placesEnabled} onLocationChange={(location) => { setExistingProperty(null); setProperty((current) => ({ ...current, direccion: location.direccion, googlePlaceId: location.googlePlaceId, latitud: location.latitud, longitud: location.longitud, confirmarDuplicado: false })); }} /></div>
      {duplicates.length > 0 ? <Alert variant="warning">
        <p className="font-semibold">Ya hay {duplicates.length === 1 ? "una propiedad" : "propiedades"} con esta dirección o ubicación.</p>
        <p className="mt-2">Si son unidades del mismo inmueble, selecciona su ficha para agregarlas aquí.</p>
        <ul className="mt-3 space-y-3">{duplicates.map((duplicate) => <li className="rounded-lg border border-warning/30 p-3" key={duplicate.id}>
          <Link className="font-semibold underline" href={`/propiedades/${duplicate.id}`}>{duplicate.direccion}</Link> · {duplicate.unidades} {duplicate.unidades === 1 ? "unidad" : "unidades"}
          {duplicate.archivadaEn ? <p className="mt-2">Archivada: reactívala desde su ficha para agregar unidades.</p> : <label className="mt-2 flex items-start gap-2">
            <input checked={existingProperty?.id === duplicate.id} className="mt-1" name="destinoPropiedad" onChange={() => { setExistingProperty(duplicate); updateProperty("confirmarDuplicado", false); setMessage(undefined); }} type="radio" />
            <span>Agregar unidades a esta propiedad</span>
          </label>}
        </li>)}</ul>
        <label className="mt-3 flex items-start gap-2"><input checked={property.confirmarDuplicado} className="mt-1" name="destinoPropiedad" onChange={() => { setExistingProperty(null); updateProperty("confirmarDuplicado", true); }} type="radio" /><span>Es un inmueble distinto y deseo crear otra ficha.</span></label>
      </Alert> : null}
    </section> : null}

    <fieldset disabled={Boolean(existingProperty) || step !== 1} aria-hidden={step !== 1} className={step === 1 ? "" : "hidden"}>
    <section className="space-y-6 rounded-xl border border-border p-4 sm:p-5">
      <div><h2 className="font-serif text-xl font-semibold text-ink">Valores y fotos</h2><p className="mt-1 text-sm text-ink-secondary">Los importes corresponden al predio completo y se capturan en pesos mexicanos.</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><Field hint="Valor registrado para fines fiscales." label="Valor catastral"><MoneyInput defaultValue={property.valorCatastral} name="valorCatastral" onChange={(event) => updateProperty("valorCatastral", event.currentTarget.value)} required /></Field><Field hint="Valor estimado total del inmueble." label="Valor comercial total"><MoneyInput defaultValue={property.valorComercialTotal} name="valorComercialTotal" onChange={(event) => updateProperty("valorComercialTotal", event.currentTarget.value)} required /></Field><Field hint="Pago total estimado por año." label="Predial anual"><MoneyInput defaultValue={property.predialAnual} name="predialAnual" onChange={(event) => updateProperty("predialAnual", event.currentTarget.value)} required /></Field><Field hint="Cuotas y servicios comunes por año." label="Mantenimiento anual"><MoneyInput defaultValue={property.mantenimientoAnual} name="mantenimientoAnual" onChange={(event) => updateProperty("mantenimientoAnual", event.currentTarget.value)} required /></Field></div>
      <div className="border-t border-border pt-6"><h3 className="font-serif text-lg font-semibold text-ink">Fotos</h3><p className="mt-1 text-sm text-ink-secondary">Este paso es opcional; puedes agregar hasta 8 imágenes.</p><div className="mt-4"><PropertyPhotoInput inputRef={photoInputRef} onFilesChange={(files) => setPhotoCount(files.length)} /></div></div>
    </section>
    </fieldset>

    {step === 2 ? <section className="space-y-5 rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-xl font-semibold text-ink">Unidades y contratos</h2><p className="mt-1 max-w-2xl text-sm text-ink-secondary">{existingProperty ? "Agrega las nuevas unidades de la propiedad seleccionada. Cada una puede tener su propio dueño y contrato." : "Puedes dejar el predio sin unidades, agregar varias, y elegir cuáles se ocupan desde ahora con un contrato activo."}</p></div><Button onClick={() => setUnits((current) => [...current, emptyUnit()])}>Agregar unidad</Button></div>
      {units.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-bg/50 p-5 text-sm text-ink-secondary">{existingProperty ? "Agrega al menos una unidad para continuar." : "Aún no has agregado unidades. Puedes continuar para registrar únicamente el predio."}</div> : <div className="space-y-5">{units.map((unit, index) => <article className="rounded-xl border border-border bg-bg/40 p-4 sm:p-5" key={unit.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-brand">Unidad {index + 1}</p><h3 className="mt-1 font-serif text-lg font-semibold text-ink">{unit.identificador || "Sin identificador"}</h3></div><Button onClick={() => setUnits((current) => current.filter((candidate) => candidate.id !== unit.id))} variant="secondary">Quitar unidad</Button></div>
        <div className="mt-5"><OwnerSelector label="Propietario de la unidad" onChange={(owner) => updateUnit(unit.id, (current) => ({ ...current, propietario: owner }))} owners={owners} value={unit.propietario} /></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Field label="Identificador"><Input maxLength={100} onChange={(event) => updateUnitField(unit.id, "identificador", event.target.value)} placeholder="101, Local A…" required value={unit.identificador} /></Field><Field label="Tipo de unidad"><Select onChange={(event) => updateUnitField(unit.id, "tipo", event.target.value)} required value={unit.tipo}><option value="">Selecciona un tipo</option><option value="DEPARTAMENTO">Departamento</option><option value="LOCAL_COMERCIAL">Local comercial</option><option value="ACCESORIA">Accesoria</option><option value="BODEGA">Bodega</option><option value="OFICINA">Oficina</option><option value="OTRO">Otro</option></Select></Field><Field label="Superficie (m²)"><Input inputMode="decimal" onChange={(event) => updateUnitField(unit.id, "metrosCuadrados", event.target.value)} placeholder="0.00" required value={unit.metrosCuadrados} /></Field><Field label="Piso"><Input maxLength={50} onChange={(event) => updateUnitField(unit.id, "piso", event.target.value)} placeholder="Opcional" value={unit.piso} /></Field><Field label="Recámaras"><Input min={0} onChange={(event) => updateUnitField(unit.id, "recamaras", event.target.value)} type="number" value={unit.recamaras} /></Field><Field label="Baños completos"><Input min={0} onChange={(event) => updateUnitField(unit.id, "banosCompletos", event.target.value)} type="number" value={unit.banosCompletos} /></Field><Field label="Medios baños"><Input min={0} onChange={(event) => updateUnitField(unit.id, "mediosBanos", event.target.value)} type="number" value={unit.mediosBanos} /></Field></div>
        <div className="mt-5"><Field label="Descripción"><Textarea maxLength={2000} onChange={(event) => updateUnitField(unit.id, "descripcion", event.target.value)} placeholder="Opcional" rows={3} value={unit.descripcion} /></Field></div>
        <fieldset className="mt-5"><legend className="text-sm font-semibold text-ink">Amenidades</legend><p className="mt-2 text-xs text-ink-secondary">Selecciona las amenidades disponibles en esta unidad.</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{unitAmenities.map((amenity) => <label className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2" key={amenity}><input checked={unit.amenidades.includes(amenity)} onChange={(event) => toggleAmenity(unit.id, amenity, event.target.checked)} type="checkbox" value={amenity} />{amenity}</label>)}</div>{unit.amenidades.includes("Roof garden") || unit.amenidades.includes("Balcón") || unit.amenidades.includes("Estacionamiento") ? <div className="mt-4 grid gap-4 rounded-xl border border-brand/10 bg-surface p-4 sm:grid-cols-3">{unit.amenidades.includes("Roof garden") ? <Field label="m² de roof garden"><Input inputMode="decimal" min="0.01" onChange={(event) => updateUnit(unit.id, (current) => ({ ...current, atributos: { ...current.atributos, roofGardenMetrosCuadrados: event.target.value } }))} required step="0.01" value={unit.atributos.roofGardenMetrosCuadrados ?? ""} /></Field> : null}{unit.amenidades.includes("Balcón") ? <Field label="m² de balcón"><Input inputMode="decimal" min="0.01" onChange={(event) => updateUnit(unit.id, (current) => ({ ...current, atributos: { ...current.atributos, balconMetrosCuadrados: event.target.value } }))} required step="0.01" value={unit.atributos.balconMetrosCuadrados ?? ""} /></Field> : null}{unit.amenidades.includes("Estacionamiento") ? <Field label="Cajones de estacionamiento"><Input min={1} onChange={(event) => updateUnit(unit.id, (current) => ({ ...current, atributos: { ...current.atributos, cajonesEstacionamiento: event.target.value } }))} required type="number" value={unit.atributos.cajonesEstacionamiento ?? ""} /></Field> : null}</div> : null}</fieldset>
        <label className="mt-6 flex items-start gap-3 rounded-xl border border-brand/15 bg-brand-soft/30 p-4 text-sm"><input checked={Boolean(unit.contrato)} className="mt-1" onChange={(event) => updateUnit(unit.id, (current) => ({ ...current, contrato: event.target.checked ? emptyContract() : null }))} type="checkbox" /><span><strong className="block text-ink">Crear contrato activo ahora</strong><span className="mt-1 block text-ink-secondary">Desmárcalo si la unidad quedará disponible por el momento.</span></span></label>
        {unit.contrato ? <ContractFields contract={unit.contrato} onChange={(update) => updateContract(unit.id, update)} unitLabel={unit.identificador || `Unidad ${index + 1}`} /> : null}
      </article>)}</div>}
    </section> : null}

    {step === 3 ? <section className="space-y-6 rounded-xl border border-border p-4 sm:p-5"><div><h2 className="font-serif text-xl font-semibold text-ink">Revisa antes de crear</h2><p className="mt-1 text-sm text-ink-secondary">Puedes volver a cualquier paso para corregir los datos. Al confirmar se crearán todos los registros juntos.</p></div><div className="grid gap-4 lg:grid-cols-2"><ReviewCard action={() => goTo(0)} title="Propiedad"><p>{existingProperty?.direccion ?? (property.direccion || "Sin dirección")}</p><p className="mt-1 text-sm text-ink-secondary">{existingProperty ? `Se agregarán ${units.length} unidades a las ${existingProperty.unidades} existentes.` : `Propietario: ${ownerName(propertyOwner, owners)}`}</p></ReviewCard>{!existingProperty ? <ReviewCard action={() => goTo(1)} title="Valores y fotos"><p>Valor comercial: {property.valorComercialTotal}</p><p className="mt-1 text-sm text-ink-secondary">Predial: {property.predialAnual} · Mantenimiento: {property.mantenimientoAnual}</p><p className="mt-1 text-sm text-ink-secondary">{photoCount} fotos seleccionadas</p></ReviewCard> : null}<ReviewCard action={() => goTo(2)} title="Unidades"><p>{units.length === 0 ? "Predio sin unidades iniciales" : `${units.length} ${units.length === 1 ? "unidad" : "unidades"}`}</p>{units.map((unit) => <p className="mt-1 text-sm text-ink-secondary" key={unit.id}>{unit.identificador} · {unit.contrato ? "Contrato activo" : "Disponible"} · {ownerName(unit.propietario, owners)}</p>)}</ReviewCard></div><Alert variant="info">{existingProperty ? "Al confirmar, las nuevas unidades, sus propietarios, contratos y recibos aplicables se agregarán a la ficha seleccionada en una sola operación. Se conservarán los datos y unidades existentes." : "Al confirmar, el predio, propietarios nuevos, unidades, contratos y recibos aplicables se guardarán en una sola operación."}</Alert></section> : null}

    <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"><Link className="px-2 py-2 text-sm font-semibold text-ink-secondary hover:text-ink" href="/propiedades" onClick={confirmCancel}>Cancelar</Link><div className="flex gap-3">{step > 0 ? <Button onClick={() => goTo(step - 1)} variant="secondary">Anterior</Button> : null}{step < steps.length - 1 ? <Button disabled={checkingDuplicates} onClick={() => goTo(step + 1)}>Siguiente</Button> : <Button disabled={submitting} type="submit">{submitting ? "Guardando registros…" : existingProperty ? "Confirmar y agregar unidades" : "Confirmar y crear propiedad"}</Button>}</div></div>
  </form>;
}

function ContractFields({ contract, onChange, unitLabel }: { contract: ContractDraft; onChange: (update: (contract: ContractDraft) => ContractDraft) => void; unitLabel: string }) {
  function update(field: keyof ContractDraft, value: string) {
    onChange((current) => ({ ...current, [field]: value }));
  }
  function updateTerm(field: "fechaInicio" | "plazoMeses" | "diaPago" | "fechaFin", value: string) {
    onChange((current) => {
      const next = { ...current, [field]: value };
      if (field !== "fechaFin") {
        const calculated = calculatedEndDate(next.fechaInicio, next.plazoMeses, next.diaPago);
        if (calculated) next.fechaFin = calculated;
        if (field === "fechaInicio" || field === "diaPago") next.fechaProximoCobro = suggestedNextCollection(next.fechaInicio, next.diaPago);
      }
      return next;
    });
  }

  const isPagare = contract.tipoGarantia === "PAGARE";
  return <section className="mt-6 space-y-5 rounded-xl border border-brand/20 bg-surface p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand">Contrato activo</p><h4 className="mt-1 font-serif text-lg font-semibold text-ink">{unitLabel}</h4></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre del arrendatario"><Input autoComplete="name" maxLength={250} onChange={(event) => update("arrendatario", event.target.value)} required value={contract.arrendatario} /></Field><Field label="Correo electrónico"><Input autoComplete="email" maxLength={254} onChange={(event) => update("emailArrendatario", event.target.value)} placeholder="Opcional" type="email" value={contract.emailArrendatario} /></Field><Field label="Teléfono"><Input autoComplete="tel" maxLength={20} onChange={(event) => update("telefonoArrendatario", event.target.value)} placeholder="Opcional" type="tel" value={contract.telefonoArrendatario} /></Field></div><div className="border-t border-border pt-5"><h5 className="font-semibold text-ink">Garantía</h5><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Tipo de garantía"><Select onChange={(event) => update("tipoGarantia", event.target.value)} value={contract.tipoGarantia}><option value="AVAL">Aval (persona)</option><option value="PRENDA">Prenda en garantía</option><option value="INMUEBLE">Inmueble en garantía</option><option value="PAGARE">Pagaré</option></Select></Field><Field label={isPagare ? "Suscriptor del pagaré" : contract.tipoGarantia === "AVAL" ? "Nombre completo del aval" : contract.tipoGarantia === "PRENDA" ? "Descripción de la prenda" : "Descripción del inmueble"}><Input maxLength={250} onChange={(event) => update("aval", event.target.value)} required value={contract.aval} /></Field>{contract.tipoGarantia === "PRENDA" ? <Field label="Valuación de la prenda"><MoneyInput defaultValue={contract.valorGarantia} onChange={(event) => update("valorGarantia", event.currentTarget.value)} required /></Field> : null}{isPagare ? <><Field label="Importe del pagaré"><MoneyInput defaultValue={contract.pagareMonto} onChange={(event) => update("pagareMonto", event.currentTarget.value)} required /></Field><Field label="Fecha de emisión"><Input onChange={(event) => update("pagareFechaEmision", event.target.value)} required type="date" value={contract.pagareFechaEmision} /></Field><Field label="Fecha de vencimiento"><Input onChange={(event) => update("pagareFechaVencimiento", event.target.value)} required type="date" value={contract.pagareFechaVencimiento} /></Field><Field label="Lugar de pago"><Input maxLength={250} onChange={(event) => update("pagareLugarPago", event.target.value)} required value={contract.pagareLugarPago} /></Field></> : null}{contract.tipoGarantia === "AVAL" ? <><Field label="Teléfono del aval"><Input autoComplete="tel" maxLength={20} onChange={(event) => update("avalTelefono", event.target.value)} placeholder="Opcional" type="tel" value={contract.avalTelefono} /></Field><Field label="Correo del aval"><Input autoComplete="email" maxLength={254} onChange={(event) => update("avalCorreo", event.target.value)} placeholder="Opcional" type="email" value={contract.avalCorreo} /></Field></> : null}</div></div><div className="border-t border-border pt-5"><h5 className="font-semibold text-ink">Vigencia y cobro</h5><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Fecha de inicio"><Input onChange={(event) => updateTerm("fechaInicio", event.target.value)} required type="date" value={contract.fechaInicio} /></Field><Field label="Plazo (meses)"><Input max={1200} min={1} onChange={(event) => updateTerm("plazoMeses", event.target.value)} required type="number" value={contract.plazoMeses} /></Field><Field label="Periodicidad de cobro"><Select onChange={(event) => onChange((current) => ({ ...current, periodicidadCobro: event.target.value as ContractDraft["periodicidadCobro"] }))} value={contract.periodicidadCobro}><option value="MENSUAL">Mensual</option><option value="BIMESTRAL">Bimestral</option><option value="SEMESTRAL">Semestral</option><option value="ANUAL">Anual</option></Select></Field><Field label="Día de pago"><Input max={31} min={1} onChange={(event) => updateTerm("diaPago", event.target.value)} required type="number" value={contract.diaPago} /></Field><Field label="Fecha de finalización"><Input onChange={(event) => updateTerm("fechaFin", event.target.value)} required type="date" value={contract.fechaFin} /></Field><Field hint="Sugerida según el día de pago; los siguientes cobros usarán el día pactado." label="Próximo cobro"><Input min={contract.fechaInicio || undefined} onChange={(event) => update("fechaProximoCobro", event.target.value)} required type="date" value={contract.fechaProximoCobro} /></Field><Field hint="Se multiplicará por los meses cubiertos en cada recibo." label="Renta mensual base"><MoneyInput defaultValue={contract.rentaMensualBase} onChange={(event) => update("rentaMensualBase", event.currentTarget.value)} required /></Field><Field label="Depósito en garantía"><MoneyInput defaultValue={contract.depositoGarantia} onChange={(event) => update("depositoGarantia", event.currentTarget.value)} required /></Field></div></div></section>;
}

function ReviewCard({ action, children, title }: { action: () => void; children: React.ReactNode; title: string }) {
  return <section className="rounded-xl border border-border bg-bg/50 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-serif text-lg font-semibold text-ink">{title}</h3><Button className="shrink-0" onClick={action} variant="secondary">Editar</Button></div><div className="mt-3 text-sm text-ink">{children}</div></section>;
}
