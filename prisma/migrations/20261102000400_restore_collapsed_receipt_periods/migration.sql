WITH receipt_cycles AS (
  SELECT
    r."id",
    r."periodo",
    r."periodoInicio",
    r."periodoFin",
    r."estatus",
    c."fechaInicio",
    GREATEST(
      0,
      (EXTRACT(YEAR FROM r."periodo") - EXTRACT(YEAR FROM c."fechaInicio"))::int * 12
        + (EXTRACT(MONTH FROM r."periodo") - EXTRACT(MONTH FROM c."fechaInicio"))::int
    ) AS "monthOffset",
    CASE c."periodicidadCobro"
      WHEN 'MENSUAL' THEN 1
      WHEN 'BIMESTRAL' THEN 2
      WHEN 'SEMESTRAL' THEN 6
      WHEN 'ANUAL' THEN 12
    END AS "intervalMonths"
  FROM "Recibo" AS r
  INNER JOIN "Contrato" AS c ON c."id" = r."contratoId"
), receipt_boundaries AS (
  SELECT
    "id",
    "periodo",
    "periodoInicio",
    "periodoFin",
    "estatus",
    ("fechaInicio" + make_interval(months => "monthOffset"))::date AS "periodoInicioCalculado",
    ("fechaInicio" + make_interval(months => "monthOffset" + "intervalMonths"))::date AS "nextBoundary"
  FROM receipt_cycles
), corrected_ranges AS (
  SELECT
    "id",
    "periodo",
    "estatus",
    "periodoInicioCalculado",
    ("nextBoundary" - 1)::date AS "periodoFinCalculado"
  FROM receipt_boundaries
  WHERE "periodoInicio" = "periodo"
    AND "periodoFin" = "periodo"
    AND "periodoInicioCalculado" > "periodo"
), updated_receipts AS (
  UPDATE "Recibo" AS r
  SET
    "periodoInicio" = corrected."periodoInicioCalculado",
    "periodoFin" = corrected."periodoFinCalculado"
  FROM corrected_ranges AS corrected
  WHERE r."id" = corrected."id"
  RETURNING r."id", r."periodo", r."periodoInicio", r."periodoFin", r."estatus"
)
INSERT INTO "RegistroAuditoria" (
  "id",
  "usuarioSistemaId",
  "accion",
  "entidad",
  "entidadId",
  "antes",
  "despues"
)
SELECT
  gen_random_uuid(),
  NULL,
  'CORREGIR_PERIODO_RECIBO',
  'Recibo',
  updated."id"::text,
  jsonb_build_object(
    'periodoInicio', updated."periodo"::text,
    'periodoFin', updated."periodo"::text,
    'estatus', updated."estatus"
  ),
  jsonb_build_object(
    'periodoInicio', updated."periodoInicio"::text,
    'periodoFin', updated."periodoFin"::text,
    'estatus', updated."estatus",
    'motivo', 'Restauración de periodo reducido durante la migración anterior.'
  )
FROM updated_receipts AS updated;
