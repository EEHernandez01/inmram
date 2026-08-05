ALTER TABLE "Propiedad"
ADD COLUMN "googlePlaceId" TEXT,
ADD COLUMN "latitud" DECIMAL(9, 6),
ADD COLUMN "longitud" DECIMAL(9, 6);

CREATE INDEX "Propiedad_googlePlaceId_idx" ON "Propiedad"("googlePlaceId");
