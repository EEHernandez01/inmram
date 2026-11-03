WITH updated_contracts AS (
  UPDATE "Contrato" AS c
  SET "modoPeriodoCobro" = 'MES_CALENDARIO'
  WHERE lower(c."arrendatario") = 'claudio juarez/martha a. hernandez'
    AND c."periodicidadCobro" = 'MENSUAL'
    AND c."modoPeriodoCobro" = 'ANIVERSARIO'
  RETURNING c."id", c."arrendatario"
)
INSERT INTO "RegistroAuditoria" (
  "id", "usuarioSistemaId", "accion", "entidad", "entidadId", "antes", "despues"
)
SELECT
  gen_random_uuid(),
  NULL,
  'ACTUALIZAR_MODO_PERIODO_COBRO',
  'Contrato',
  updated."id"::text,
  jsonb_build_object('modoPeriodoCobro', 'ANIVERSARIO'),
  jsonb_build_object('modoPeriodoCobro', 'MES_CALENDARIO', 'arrendatario', updated."arrendatario", 'motivo', 'Ajuste solicitado para alinear recibos mensuales con el mes calendario.')
FROM updated_contracts AS updated;

WITH receipts_to_update AS (
  SELECT r."id", r."periodoInicio" AS "periodoInicioAnterior", r."periodoFin" AS "periodoFinAnterior"
  FROM "Recibo" AS r
  INNER JOIN "Contrato" AS c ON c."id" = r."contratoId"
  WHERE lower(c."arrendatario") = 'claudio juarez/martha a. hernandez'
    AND c."modoPeriodoCobro" = 'MES_CALENDARIO'
    AND c."periodicidadCobro" = 'MENSUAL'
    AND r."periodo" IN (DATE '2026-10-01', DATE '2026-11-01')
    AND (
      r."periodoInicio" <> date_trunc('month', r."periodo")::date
      OR r."periodoFin" <> (date_trunc('month', r."periodo") + INTERVAL '1 month - 1 day')::date
    )
), updated_receipts AS (
  UPDATE "Recibo" AS r
  SET
    "periodoInicio" = date_trunc('month', r."periodo")::date,
    "periodoFin" = (date_trunc('month', r."periodo") + INTERVAL '1 month - 1 day')::date
  FROM receipts_to_update AS target
  WHERE r."id" = target."id"
  RETURNING r."id", r."monto", r."fechaVencimiento", r."estatus", r."periodoInicio", r."periodoFin", target."periodoInicioAnterior", target."periodoFinAnterior"
)
INSERT INTO "RegistroAuditoria" (
  "id", "usuarioSistemaId", "accion", "entidad", "entidadId", "antes", "despues"
)
SELECT
  gen_random_uuid(),
  NULL,
  'CORREGIR_COBERTURA_MES_CALENDARIO',
  'Recibo',
  updated."id"::text,
  jsonb_build_object(
    'periodoInicio', updated."periodoInicioAnterior"::text,
    'periodoFin', updated."periodoFinAnterior"::text,
    'monto', updated."monto"::text,
    'fechaVencimiento', updated."fechaVencimiento"::text,
    'estatus', updated."estatus"
  ),
  jsonb_build_object(
    'periodoInicio', updated."periodoInicio"::text,
    'periodoFin', updated."periodoFin"::text,
    'monto', updated."monto"::text,
    'fechaVencimiento', updated."fechaVencimiento"::text,
    'estatus', updated."estatus",
    'motivo', 'Ajuste solicitado para alinear la cobertura con el mes calendario.'
  )
FROM updated_receipts AS updated;
