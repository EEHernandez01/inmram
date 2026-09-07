-- Las propiedades archivadas conservan todas sus relaciones e historial.
ALTER TABLE "Propiedad" ADD COLUMN "archivadaEn" TIMESTAMP(3);

CREATE INDEX "Propiedad_archivadaEn_idx" ON "Propiedad"("archivadaEn");
