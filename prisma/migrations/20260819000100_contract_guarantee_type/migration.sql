CREATE TYPE "TipoGarantia" AS ENUM ('AVAL', 'PRENDA', 'INMUEBLE');

ALTER TABLE "Contrato"
ADD COLUMN "tipoGarantia" "TipoGarantia" NOT NULL DEFAULT 'AVAL',
ADD COLUMN "valorGarantia" DECIMAL(14, 2);
