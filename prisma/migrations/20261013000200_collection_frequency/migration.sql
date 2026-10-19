CREATE TYPE "PeriodicidadCobro" AS ENUM ('MENSUAL', 'BIMESTRAL', 'SEMESTRAL', 'ANUAL');

ALTER TABLE "Contrato"
ADD COLUMN "periodicidadCobro" "PeriodicidadCobro" NOT NULL DEFAULT 'MENSUAL';

ALTER TABLE "Recibo"
ADD COLUMN "periodoFin" DATE;

UPDATE "Recibo"
SET "periodoFin" = (date_trunc('month', "periodo") + INTERVAL '1 month - 1 day')::date;

ALTER TABLE "Recibo"
ALTER COLUMN "periodoFin" SET NOT NULL,
ADD CONSTRAINT "Recibo_periodo_fin_check" CHECK ("periodoFin" >= "periodo");

CREATE INDEX "Recibo_periodoFin_idx" ON "Recibo"("periodoFin");
