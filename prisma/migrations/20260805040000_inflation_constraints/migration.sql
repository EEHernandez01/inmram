ALTER TABLE "IndiceInflacion"
  ADD CONSTRAINT "IndiceInflacion_corte_mismo_mes_check" CHECK (
    DATE_TRUNC('month', "fechaCorte") = DATE_TRUNC('month', "mes")
  );

ALTER TABLE "AjusteInflacion"
  ADD CONSTRAINT "AjusteInflacion_renta_positiva_check" CHECK ("rentaResultante" > 0);
