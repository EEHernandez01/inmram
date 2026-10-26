ALTER TABLE "IndiceInflacion"
  DROP CONSTRAINT "IndiceInflacion_valor_positivo_check";

ALTER TABLE "IndiceInflacion"
  ADD CONSTRAINT "IndiceInflacion_valor_por_tipo_check" CHECK (
    ("indice" = 'INPC' AND "valor" > 0)
    OR (
      "indice" IN ('INFLACION_MENSUAL', 'INFLACION_ANUAL')
      AND "valor" > -100
    )
    OR (
      "indice" NOT IN ('INPC', 'INFLACION_MENSUAL', 'INFLACION_ANUAL')
      AND "valor" > 0
    )
  );
