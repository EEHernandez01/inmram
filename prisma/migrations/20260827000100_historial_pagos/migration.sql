CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "PagoRecibo" (
    "id" UUID NOT NULL,
    "reciboId" UUID NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "fechaPago" DATE NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "referencia" TEXT,
    "registradoPorId" UUID,
    "anuladoEn" TIMESTAMP(3),
    "anuladoPorId" UUID,
    "motivoAnulacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoRecibo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PagoRecibo_reciboId_anuladoEn_idx" ON "PagoRecibo"("reciboId", "anuladoEn");
CREATE INDEX "PagoRecibo_registradoPorId_idx" ON "PagoRecibo"("registradoPorId");
CREATE INDEX "PagoRecibo_anuladoPorId_idx" ON "PagoRecibo"("anuladoPorId");

ALTER TABLE "PagoRecibo"
ADD CONSTRAINT "PagoRecibo_monto_positivo_check" CHECK ("monto" > 0),
ADD CONSTRAINT "PagoRecibo_reversion_coherente_check" CHECK (
    ("anuladoEn" IS NULL AND "anuladoPorId" IS NULL AND "motivoAnulacion" IS NULL)
    OR
    ("anuladoEn" IS NOT NULL AND "anuladoPorId" IS NOT NULL AND "motivoAnulacion" IS NOT NULL)
);

ALTER TABLE "PagoRecibo" ADD CONSTRAINT "PagoRecibo_reciboId_fkey"
FOREIGN KEY ("reciboId") REFERENCES "Recibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PagoRecibo" ADD CONSTRAINT "PagoRecibo_registradoPorId_fkey"
FOREIGN KEY ("registradoPorId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PagoRecibo" ADD CONSTRAINT "PagoRecibo_anuladoPorId_fkey"
FOREIGN KEY ("anuladoPorId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Conserva los recibos ya pagados como movimientos históricos. Los importes
-- coinciden con el total vigente de renta y servicios; el agua está incluida.
INSERT INTO "PagoRecibo" ("id", "reciboId", "monto", "fechaPago", "formaPago")
SELECT gen_random_uuid(), "id", "monto" + "cargoFijo", "fechaPago", "formaPago"
FROM "Recibo"
WHERE "estatus" = 'PAGADO'
  AND "fechaPago" IS NOT NULL
  AND "formaPago" IS NOT NULL;
