import { z } from "zod";

const propertyPhotoMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const propertyPhotoUploadSchema = z
  .object({
    url: z.url().max(2_048),
    pathname: z.string().trim().regex(/^propiedades\/[a-zA-Z0-9_./-]+$/, "La ruta de la foto no es válida."),
    nombre: z.string().trim().min(1).max(255),
    mimeType: z.enum(propertyPhotoMimeTypes),
    tamanoBytes: z.number().int().positive().max(4 * 1024 * 1024),
  })
  .superRefine((photo, context) => {
    const url = new URL(photo.url);
    if (!url.hostname.endsWith(".public.blob.vercel-storage.com")) {
      context.addIssue({ code: "custom", message: "La foto debe provenir del almacenamiento autorizado.", path: ["url"] });
    }
    if (url.pathname !== `/${photo.pathname}`) {
      context.addIssue({ code: "custom", message: "La ruta de la foto no coincide.", path: ["pathname"] });
    }
  });

export type PropertyPhotoUpload = z.infer<typeof propertyPhotoUploadSchema>;
