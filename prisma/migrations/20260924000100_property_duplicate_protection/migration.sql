ALTER TABLE "Propiedad" ADD COLUMN "direccionNormalizada" TEXT;

UPDATE "Propiedad"
SET "direccionNormalizada" = trim(regexp_replace(
  lower(translate("direccion", 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')),
  '[^a-z0-9]+',
  ' ',
  'g'
));

ALTER TABLE "Propiedad" ALTER COLUMN "direccionNormalizada" SET NOT NULL;

CREATE INDEX "Propiedad_direccionNormalizada_idx" ON "Propiedad"("direccionNormalizada");
