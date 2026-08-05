-- Add the immutable due-date snapshot to existing and future receipts.
ALTER TABLE "Recibo" ADD COLUMN "fechaVencimiento" DATE;

-- Backfill safely if receipts already exist. When the configured payment day
-- does not exist in the period, the due date is the first day of next month.
UPDATE "Recibo" AS recibo
SET "fechaVencimiento" = CASE
  WHEN contrato."diaPago" <= EXTRACT(
    DAY FROM (date_trunc('month', recibo."periodo") + INTERVAL '1 month - 1 day')
  )
  THEN (
    date_trunc('month', recibo."periodo")
    + ((contrato."diaPago" - 1) * INTERVAL '1 day')
  )::date
  ELSE (date_trunc('month', recibo."periodo") + INTERVAL '1 month')::date
END
FROM "Contrato" AS contrato
WHERE contrato."id" = recibo."contratoId";

ALTER TABLE "Recibo" ALTER COLUMN "fechaVencimiento" SET NOT NULL;

CREATE INDEX "Recibo_fechaVencimiento_idx" ON "Recibo"("fechaVencimiento");

ALTER TABLE "Recibo"
ADD CONSTRAINT "Recibo_fecha_vencimiento_check"
CHECK ("fechaVencimiento" >= "periodo");
