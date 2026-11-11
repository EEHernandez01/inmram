export async function optimizePropertyPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2_000 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No fue posible optimizar la foto.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const optimized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!optimized) throw new Error("No fue posible optimizar la foto.");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([optimized], `${baseName}.webp`, { type: "image/webp", lastModified: file.lastModified });
}
