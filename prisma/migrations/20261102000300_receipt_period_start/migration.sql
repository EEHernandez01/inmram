ALTER TABLE "Recibo"
ADD COLUMN "periodoInicio" DATE;

UPDATE "Recibo" AS r
SET "periodoInicio" = (
  c."fechaInicio" + make_interval(
    months => GREATEST(
      0,
      (EXTRACT(YEAR FROM r."periodo") - EXTRACT(YEAR FROM c."fechaInicio"))::int * 12
        + (EXTRACT(MONTH FROM r."periodo") - EXTRACT(MONTH FROM c."fechaInicio"))::int
    )
  )
)::date
FROM "Contrato" AS c
WHERE c."id" = r."contratoId";

ALTER TABLE "Recibo"
ALTER COLUMN "periodoInicio" SET NOT NULL;

ALTER TABLE "Recibo"
ADD CONSTRAINT "Recibo_periodo_rango_check"
CHECK ("periodoInicio" <= "periodoFin");

CREATE INDEX "Recibo_periodoInicio_periodoFin_idx"
ON "Recibo"("periodoInicio", "periodoFin");
