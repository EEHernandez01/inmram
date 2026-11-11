import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { MAX_PROPERTY_PHOTO_SIZE_BYTES } from "@/lib/property-photo-limits";

const propertyPhotoPath = /^propiedades\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp)$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireSystemRole(WRITE_ROLES);
        if (!propertyPhotoPath.test(pathname)) {
          throw new Error("Ruta de foto no válida.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_PROPERTY_PHOTO_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "No fue posible preparar la carga de la foto." }, { status: 400 });
  }
}
