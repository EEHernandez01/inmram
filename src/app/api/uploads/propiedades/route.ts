import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";

const maxPhotoSize = 5 * 1024 * 1024;
const allowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    if (body.type === "blob.generate-client-token") {
      await requireSystemRole(WRITE_ROLES);
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^propiedades\/[a-zA-Z0-9_./-]+$/.test(pathname)) {
          throw new Error("La ruta de carga no es válida.");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes,
          maximumSizeInBytes: maxPhotoSize,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible preparar la carga de fotos." },
      { status: 400 },
    );
  }
}
