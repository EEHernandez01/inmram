CREATE TABLE "BorradorAltaPropiedad" (
    "id" UUID NOT NULL,
    "usuarioSistemaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorradorAltaPropiedad_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BorradorAltaPropiedad_usuarioSistemaId_actualizadoEn_idx"
ON "BorradorAltaPropiedad"("usuarioSistemaId", "actualizadoEn");

ALTER TABLE "BorradorAltaPropiedad"
ADD CONSTRAINT "BorradorAltaPropiedad_usuarioSistemaId_fkey"
FOREIGN KEY ("usuarioSistemaId") REFERENCES "UsuarioSistema"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
