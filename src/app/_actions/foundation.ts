"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { EstadoContrato, TipoUnidad } from "@/generated/prisma/enums";

import { DomainError } from "@/lib/domain/errors";
import {
  actualizarContrato,
  actualizarPropiedad,
  actualizarUnidad,
  crearContrato,
  crearPropiedad,
  crearUnidad,
  eliminarPropiedad,
  eliminarUnidad,
  vencerContrato,
} from "@/lib/services/foundation";
import { obtenerPropietarioActual } from "@/lib/services/profile";
import { prisma } from "@/lib/db/prisma";

export type FoundationActionState = { error?: string };

const value = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

function optionalValue(formData: FormData, key: string) {
  const input = value(formData, key).trim();
  return input || null;
}

function errorState(error: unknown): FoundationActionState {
  if (error instanceof z.ZodError) {
    return { error: error.issues[0]?.message ?? "Revisa los datos capturados." };
  }

  if (error instanceof DomainError) {
    return { error: error.message };
  }

  return { error: "No fue posible guardar los cambios. Intenta nuevamente." };
}

function propertyInput(formData: FormData, ownerId: string) {
  return {
    propietarioId: ownerId,
    marcaId: optionalValue(formData, "marcaId"),
    direccion: value(formData, "direccion"),
    googlePlaceId: optionalValue(formData, "googlePlaceId"),
    latitud: optionalValue(formData, "latitud"),
    longitud: optionalValue(formData, "longitud"),
    valorCatastral: value(formData, "valorCatastral"),
    valorComercialTotal: value(formData, "valorComercialTotal"),
    predialAnual: value(formData, "predialAnual"),
    mantenimientoAnual: value(formData, "mantenimientoAnual"),
  };
}

export async function createPropertyAction(
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  let propertyId: string;
  try {
    const owner = await obtenerPropietarioActual();
    const property = await crearPropiedad(propertyInput(formData, owner.id));
    propertyId = property.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/propiedades");
  redirect(`/propiedades/${propertyId}`);
}

export async function createPropertyFormAction(formData: FormData) {
  let propertyId: string;
  try {
    const owner = await obtenerPropietarioActual();
    const property = await crearPropiedad(propertyInput(formData, owner.id));
    propertyId = property.id;
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath("/propiedades");
  redirect(`/propiedades/${propertyId}`);
}

export async function updatePropertyAction(
  propertyId: string,
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  try {
    const owner = await obtenerPropietarioActual();
    await actualizarPropiedad(propertyId, propertyInput(formData, owner.id));
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${propertyId}`);
  redirect(`/propiedades/${propertyId}`);
}

export async function updatePropertyFormAction(propertyId: string, formData: FormData) {
  try {
    const owner = await obtenerPropietarioActual();
    await actualizarPropiedad(propertyId, propertyInput(formData, owner.id));
    await guardarFotosDePropiedad(propertyId, formData);
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${propertyId}`);
  redirect(`/propiedades/${propertyId}`);
}

async function guardarFotosDePropiedad(propertyId: string, formData: FormData) {
  const photos = formData.getAll("fotos").filter((value): value is File => value instanceof File && value.size > 0);
  if (photos.length === 0) return;

  const existingCount = await prisma.archivoExpediente.count({
    where: { propiedadId: propertyId, tipo: "FOTO_PROPIEDAD" },
  });
  if (existingCount + photos.length > 8) {
    throw new DomainError("PHOTO_LIMIT", "Puedes tener hasta 8 fotos por propiedad.");
  }

  const folder = path.join(process.cwd(), "public", "uploads", "propiedades", propertyId);
  await mkdir(folder, { recursive: true });

  for (const [index, photo] of photos.entries()) {
    if (!/^image\/(jpeg|png|webp)$/.test(photo.type) || photo.size > 5 * 1024 * 1024) {
      throw new DomainError("INVALID_PHOTO", "Cada foto debe ser JPG, PNG o WebP y pesar máximo 5 MB.");
    }
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;
    await writeFile(path.join(folder, filename), Buffer.from(await photo.arrayBuffer()));
    await prisma.archivoExpediente.create({
      data: {
        propiedadId: propertyId,
        tipo: "FOTO_PROPIEDAD",
        url: `/uploads/propiedades/${propertyId}/${filename}`,
        nombre: photo.name,
        mimeType: photo.type,
        tamanoBytes: photo.size,
        orden: existingCount + index,
      },
    });
  }
}

export async function deletePropertyAction(propertyId: string) {
  await eliminarPropiedad(propertyId);
  revalidatePath("/propiedades");
  redirect("/propiedades");
}

function unitInput(formData: FormData) {
  return {
    propiedadId: value(formData, "propiedadId"),
    identificador: value(formData, "identificador"),
    tipo: value(formData, "tipo") as TipoUnidad,
    metrosCuadrados: value(formData, "metrosCuadrados"),
    descripcion: optionalValue(formData, "descripcion"),
    piso: optionalValue(formData, "piso"),
    atributos: null,
    recamaras: Number(value(formData, "recamaras") || 0),
    banosCompletos: Number(value(formData, "banosCompletos") || 0),
    mediosBanos: Number(value(formData, "mediosBanos") || 0),
    amenidades: value(formData, "amenidades").split(",").map((item) => item.trim()).filter(Boolean),
  };
}

export async function createUnitAction(
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  let unitId: string;
  const propertyId = value(formData, "propiedadId");
  try {
    const unit = await crearUnidad(unitInput(formData));
    unitId = unit.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/propiedades/${propertyId}`);
  redirect(`/propiedades/${propertyId}/unidades/${unitId}`);
}

export async function createUnitFormAction(formData: FormData) {
  let unitId: string;
  const propertyId = value(formData, "propiedadId");
  try {
    const unit = await crearUnidad(unitInput(formData));
    unitId = unit.id;
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath(`/propiedades/${propertyId}`);
  redirect(`/propiedades/${propertyId}/unidades/${unitId}`);
}

export async function updateUnitAction(
  unitId: string,
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  const propertyId = value(formData, "propiedadId");
  try {
    await actualizarUnidad(unitId, unitInput(formData));
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(`/propiedades/${propertyId}`);
  revalidatePath(`/propiedades/${propertyId}/unidades/${unitId}`);
  redirect(`/propiedades/${propertyId}/unidades/${unitId}`);
}

export async function updateUnitFormAction(unitId: string, formData: FormData) {
  const propertyId = value(formData, "propiedadId");
  try {
    await actualizarUnidad(unitId, unitInput(formData));
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath(`/propiedades/${propertyId}`);
  revalidatePath(`/propiedades/${propertyId}/unidades/${unitId}`);
  redirect(`/propiedades/${propertyId}/unidades/${unitId}`);
}

export async function deleteUnitAction(
  unitId: string,
  propertyId: string,
) {
  await eliminarUnidad(unitId);
  revalidatePath(`/propiedades/${propertyId}`);
  redirect(`/propiedades/${propertyId}`);
}

function contractInput(formData: FormData) {
  return {
    unidadId: value(formData, "unidadId"),
    arrendatario: value(formData, "arrendatario"),
    emailArrendatario: optionalValue(formData, "emailArrendatario"),
    telefonoArrendatario: optionalValue(formData, "telefonoArrendatario"),
    aval: value(formData, "aval"),
    tipoGarantia: value(formData, "tipoGarantia") as "AVAL" | "PRENDA" | "INMUEBLE",
    valorGarantia: optionalValue(formData, "valorGarantia"),
    fechaInicio: value(formData, "fechaInicio"),
    plazoMeses: Number(value(formData, "plazoMeses")),
    fechaFin: value(formData, "fechaFin"),
    rentaMensualBase: value(formData, "rentaMensualBase"),
    diaPago: Number(value(formData, "diaPago")),
    depositoGarantia: value(formData, "depositoGarantia"),
    estado: value(formData, "estado") as EstadoContrato,
  };
}

export async function createContractAction(
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  let contractId: string;
  try {
    const contract = await crearContrato(contractInput(formData));
    contractId = contract.id;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/contratos");
  revalidatePath(`/propiedades/${value(formData, "propiedadId")}`);
  redirect(`/contratos/${contractId}`);
}

export async function createContractFormAction(formData: FormData) {
  let contractId: string;
  try {
    const contract = await crearContrato(contractInput(formData));
    contractId = contract.id;
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath("/contratos");
  revalidatePath(`/propiedades/${value(formData, "propiedadId")}`);
  redirect(`/contratos/${contractId}`);
}

export async function updateContractAction(
  contractId: string,
  _state: FoundationActionState | undefined,
  formData: FormData,
) {
  try {
    await actualizarContrato(contractId, contractInput(formData));
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contractId}`);
  redirect(`/contratos/${contractId}`);
}

export async function updateContractFormAction(contractId: string, formData: FormData) {
  try {
    await actualizarContrato(contractId, contractInput(formData));
  } catch (error) {
    throw new Error(errorState(error).error);
  }

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contractId}`);
  redirect(`/contratos/${contractId}`);
}

export async function expireContractAction(contractId: string) {
  await vencerContrato(contractId);
  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contractId}`);
}
