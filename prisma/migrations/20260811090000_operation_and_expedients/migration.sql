CREATE TYPE "EstadoRenovacion" AS ENUM ('PENDIENTE', 'RENOVADO', 'NO_RENOVADO');
CREATE TYPE "TipoArchivo" AS ENUM ('FOTO_PROPIEDAD', 'CONTRATO_PDF');

ALTER TABLE "Unidad" ADD COLUMN "recamaras" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Unidad" ADD COLUMN "banosCompletos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Unidad" ADD COLUMN "mediosBanos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Unidad" ADD COLUMN "amenidades" JSONB;

ALTER TABLE "Contrato" ADD COLUMN "cargoFijoMensual" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "Contrato" ADD COLUMN "avalTelefono" TEXT;
ALTER TABLE "Contrato" ADD COLUMN "avalCorreo" TEXT;
ALTER TABLE "Contrato" ADD COLUMN "renovacionEstado" "EstadoRenovacion" NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE "Contrato" ADD COLUMN "renovacionNotificadaEn" DATE;

ALTER TABLE "Recibo" ADD COLUMN "cargoFijo" DECIMAL(14,2) NOT NULL DEFAULT 0;

CREATE TABLE "ArchivoExpediente" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "propiedadId" UUID,
  "contratoId" UUID,
  "tipo" "TipoArchivo" NOT NULL,
  "url" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "tamanoBytes" INTEGER NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchivoExpediente_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArchivoExpediente_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArchivoExpediente_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ArchivoExpediente_propiedadId_tipo_orden_idx" ON "ArchivoExpediente"("propiedadId", "tipo", "orden");
CREATE INDEX "ArchivoExpediente_contratoId_tipo_idx" ON "ArchivoExpediente"("contratoId", "tipo");
