import "server-only";

import { del } from "@vercel/blob";

import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import {
  propertyPhotoUploadSchema,
  type PropertyPhotoUpload,
} from "@/lib/validation/property-photos";

const MAX_PHOTOS_PER_PROPERTY = 8;

export function propertyPhotoUploadsFromFormData(formData: FormData) {
  const uploads = formData.getAll("fotosBlob").map((value) => {
    if (typeof value !== "string") {
      throw new DomainError("INVALID_PHOTO", "Las fotos cargadas no son válidas.");
    }

    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new DomainError("INVALID_PHOTO", "Las fotos cargadas no son válidas.");
    }
  });

  const parsed = uploads.map((upload) => propertyPhotoUploadSchema.parse(upload));
  if (parsed.length > MAX_PHOTOS_PER_PROPERTY) {
    throw new DomainError("PHOTO_LIMIT", "Puedes tener hasta 8 fotos por propiedad.");
  }

  if (new Set(parsed.map((photo) => photo.url)).size !== parsed.length) {
    throw new DomainError("INVALID_PHOTO", "No repitas la misma foto.");
  }

  return parsed;
}

export async function guardarFotosBlobDePropiedad(
  propertyId: string,
  photos: readonly PropertyPhotoUpload[],
) {
  if (photos.length === 0) return;

  const existingCount = await prisma.archivoExpediente.count({
    where: { propiedadId: propertyId, tipo: "FOTO_PROPIEDAD" },
  });

  if (existingCount + photos.length > MAX_PHOTOS_PER_PROPERTY) {
    throw new DomainError("PHOTO_LIMIT", "Puedes tener hasta 8 fotos por propiedad.");
  }

  await prisma.archivoExpediente.createMany({
    data: photos.map((photo, index) => ({
      propiedadId: propertyId,
      tipo: "FOTO_PROPIEDAD",
      url: photo.url,
      nombre: photo.nombre,
      mimeType: photo.mimeType,
      tamanoBytes: photo.tamanoBytes,
      orden: existingCount + index,
    })),
  });
}

export async function eliminarFotosBlob(
  photos: readonly Pick<PropertyPhotoUpload, "url">[],
) {
  if (photos.length === 0) return;

  try {
    await del(photos.map((photo) => photo.url));
  } catch (error) {
    console.error("No fue posible eliminar fotos huérfanas de Blob.", error);
  }
}
