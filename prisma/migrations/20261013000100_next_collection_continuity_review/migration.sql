ALTER TYPE "EstadoRecibo" ADD VALUE 'REVISION';
ALTER TYPE "EstadoRecibo" ADD VALUE 'OMITIDO';

ALTER TABLE "Contrato"
ADD COLUMN "fechaProximoCobro" DATE,
ADD COLUMN "continuidadMensual" BOOLEAN NOT NULL DEFAULT false;
