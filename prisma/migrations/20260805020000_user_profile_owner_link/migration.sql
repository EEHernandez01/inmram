-- AlterTable
ALTER TABLE "Propietario" ADD COLUMN "usuarioSistemaId" UUID;

-- CreateTable
CREATE TABLE "PerfilUsuario" (
    "id" UUID NOT NULL,
    "usuarioSistemaId" UUID NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "alias" TEXT,
    "razonSocial" TEXT,
    "telefono" TEXT,
    "rfcCifrado" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilUsuario_usuarioSistemaId_key" ON "PerfilUsuario"("usuarioSistemaId");

-- CreateIndex
CREATE UNIQUE INDEX "Propietario_usuarioSistemaId_key" ON "Propietario"("usuarioSistemaId");

-- AddForeignKey
ALTER TABLE "PerfilUsuario" ADD CONSTRAINT "PerfilUsuario_usuarioSistemaId_fkey" FOREIGN KEY ("usuarioSistemaId") REFERENCES "UsuarioSistema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propietario" ADD CONSTRAINT "Propietario_usuarioSistemaId_fkey" FOREIGN KEY ("usuarioSistemaId") REFERENCES "UsuarioSistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
