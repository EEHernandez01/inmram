ALTER TABLE "Recibo"
ADD COLUMN IF NOT EXISTS "periodoInicio" DATE;

UPDATE "Recibo" AS r
SET "periodoInicio" = LEAST((
  c."fechaInicio" + make_interval(
    months => GREATEST(
      0,
      (EXTRACT(YEAR FROM r."periodo") - EXTRACT(YEAR FROM c."fechaInicio"))::int * 12
        + (EXTRACT(MONTH FROM r."periodo") - EXTRACT(MONTH FROM c."fechaInicio"))::int
    )
  )
)::date, r."periodoFin")
FROM "Contrato" AS c
WHERE c."id" = r."contratoId";

ALTER TABLE "Recibo"
ALTER COLUMN "periodoInicio" SET NOT NULL;

ALTER TABLE "Recibo"
DROP CONSTRAINT IF EXISTS "Recibo_periodo_rango_check";

ALTER TABLE "Recibo"
ADD CONSTRAINT "Recibo_periodo_rango_check"
CHECK ("periodoInicio" <= "periodoFin");

CREATE INDEX IF NOT EXISTS "Recibo_periodoInicio_periodoFin_idx"
ON "Recibo"("periodoInicio", "periodoFin");
