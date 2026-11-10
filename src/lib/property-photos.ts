import "server-only";

import { del } from "@vercel/blob";

import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { MAX_PROPERTY_PHOTOS } from "@/lib/property-photo-limits";
import {
  propertyPhotoUploadSchema,
  type PropertyPhotoUpload,
} from "@/lib/validation/property-photos";

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
  if (parsed.length > MAX_PROPERTY_PHOTOS) {
    throw new DomainError("PHOTO_LIMIT", `Puedes tener hasta ${MAX_PROPERTY_PHOTOS} fotos por propiedad.`);
  }

  if (new Set(parsed.map((photo) => photo.url)).size !== parsed.length) {
    throw new DomainError("INVALID_PHOTO", "No repitas la misma foto.");
  }

  return parsed;
}

export async function guardarFotosBlobDePropiedad(
  propertyId: string,
  photos: readonly PropertyPhotoUpload[],
  removePhotoIds: readonly string[] = [],
) {
  if (photos.length === 0 && removePhotoIds.length === 0) return;

  const removed = await prisma.$transaction(async (tx) => {
    const existing = await tx.archivoExpediente.findMany({
      where: { propiedadId: propertyId, tipo: "FOTO_PROPIEDAD" },
      orderBy: { orden: "asc" },
    });
    const removeIds = [...new Set(removePhotoIds)];
    const filesToRemove = existing.filter((file) => removeIds.includes(file.id));
    if (filesToRemove.length !== removeIds.length) {
      throw new DomainError("INVALID_PHOTO", "Una o más fotos seleccionadas ya no están disponibles.");
    }
    const remaining = existing.filter((file) => !removeIds.includes(file.id));
    if (remaining.length + photos.length > MAX_PROPERTY_PHOTOS) {
      throw new DomainError("PHOTO_LIMIT", `Puedes tener hasta ${MAX_PROPERTY_PHOTOS} fotos por propiedad.`);
    }

    if (removeIds.length) {
      await tx.archivoExpediente.deleteMany({ where: { id: { in: removeIds }, propiedadId: propertyId, tipo: "FOTO_PROPIEDAD" } });
    }
    for (const [orden, file] of remaining.entries()) {
      if (file.orden !== orden) await tx.archivoExpediente.update({ where: { id: file.id }, data: { orden } });
    }
    if (photos.length) {
      await tx.archivoExpediente.createMany({
        data: photos.map((photo, index) => ({
          propiedadId: propertyId,
          tipo: "FOTO_PROPIEDAD",
          url: photo.url,
          nombre: photo.nombre,
          mimeType: photo.mimeType,
          tamanoBytes: photo.tamanoBytes,
          orden: remaining.length + index,
        })),
      });
    }
    return filesToRemove;
  });

  await eliminarFotosBlob(removed);
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
