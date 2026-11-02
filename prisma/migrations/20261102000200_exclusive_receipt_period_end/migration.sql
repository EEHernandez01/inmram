WITH receipt_cycles AS (
  SELECT
    r."id",
    r."periodo",
    c."fechaInicio",
    c."fechaFin",
    c."periodicidadCobro",
    GREATEST(
      0,
      (EXTRACT(YEAR FROM r."periodo") - EXTRACT(YEAR FROM c."fechaInicio"))::int * 12
        + (EXTRACT(MONTH FROM r."periodo") - EXTRACT(MONTH FROM c."fechaInicio"))::int
    ) AS "monthOffset"
  FROM "Recibo" AS r
  INNER JOIN "Contrato" AS c ON c."id" = r."contratoId"
), receipt_boundaries AS (
  SELECT
    "id",
    "periodo",
    "fechaFin",
    (
      "fechaInicio" + make_interval(
        months => "monthOffset" + CASE "periodicidadCobro"
          WHEN 'MENSUAL' THEN 1
          WHEN 'BIMESTRAL' THEN 2
          WHEN 'SEMESTRAL' THEN 6
          WHEN 'ANUAL' THEN 12
        END
      )
    )::date AS "nextBoundary"
  FROM receipt_cycles
), receipt_ends AS (
  SELECT
    "id",
    GREATEST("periodo", LEAST("fechaFin", "nextBoundary") - 1) AS "periodoFin"
  FROM receipt_boundaries
)
UPDATE "Recibo" AS r
SET "periodoFin" = e."periodoFin"
FROM receipt_ends AS e
WHERE r."id" = e."id";
