ALTER TYPE "EstadoContrato" ADD VALUE 'CANCELADO';
ALTER TYPE "TipoGarantia" ADD VALUE 'PAGARE';

ALTER TABLE "Unidad" ADD COLUMN "propietarioId" UUID;

UPDATE "Unidad"
SET "propietarioId" = "Propiedad"."propietarioId"
FROM "Propiedad"
WHERE "Unidad"."propiedadId" = "Propiedad"."id";

ALTER TABLE "Unidad" ALTER COLUMN "propietarioId" SET NOT NULL;
CREATE INDEX "Unidad_propietarioId_idx" ON "Unidad"("propietarioId");
ALTER TABLE "Unidad"
  ADD CONSTRAINT "Unidad_propietarioId_fkey"
  FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contrato"
  ADD COLUMN "pagareMonto" DECIMAL(14, 2),
  ADD COLUMN "pagareFechaEmision" DATE,
  ADD COLUMN "pagareFechaVencimiento" DATE,
  ADD COLUMN "pagareLugarPago" TEXT,
  ADD COLUMN "canceladoEn" DATE,
  ADD COLUMN "motivoCancelacion" TEXT;
