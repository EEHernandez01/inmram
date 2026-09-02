import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { isSameOrigin } from "@/lib/http/route-security";

const maxPhotoSize = 4 * 1024 * 1024;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function filenameFor(file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "foto";

  return `propiedades/${crypto.randomUUID()}-${baseName}.${extension}`;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole(WRITE_ROLES);
    const form = await request.formData();
    const photo = form.get("foto");

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "Selecciona una foto válida." }, { status: 400 });
    }
    if (!allowedContentTypes.has(photo.type) || photo.size > maxPhotoSize) {
      return NextResponse.json({ error: "Cada foto debe ser JPG, PNG o WebP y pesar máximo 4 MB." }, { status: 400 });
    }

    const blob = await put(filenameFor(photo), photo, {
      access: "public",
      addRandomSuffix: true,
      contentType: photo.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      nombre: photo.name,
      mimeType: photo.type,
      tamanoBytes: photo.size,
    });
  } catch {
    return NextResponse.json({ error: "No fue posible cargar la foto." }, { status: 500 });
  }
}
