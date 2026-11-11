export const MAX_PROPERTY_PHOTOS = 50;
export const MAX_PROPERTY_PHOTO_SIZE_BYTES = 4 * 1024 * 1024;

export function isSupportedPropertyPhoto(file: Pick<File, "name" | "type">) {
  if (["image/jpeg", "image/pjpeg", "image/png", "image/webp"].includes(file.type)) return true;

  // Some browsers leave File.type empty for valid .jpg/.jpeg files.
  return !file.type && /\.(jpe?g|png|webp)$/i.test(file.name);
}
