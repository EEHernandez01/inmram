ALTER TABLE "Contrato"
  ADD COLUMN "emailArrendatario" TEXT,
  ADD COLUMN "telefonoArrendatario" TEXT;

CREATE TABLE "RegistroAuditoria" (
  "id" UUID NOT NULL,
  "usuarioSistemaId" UUID,
  "accion" TEXT NOT NULL,
  "entidad" TEXT NOT NULL,
  "entidadId" TEXT NOT NULL,
  "antes" JSONB,
  "despues" JSONB,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistroAuditoria_entidad_entidadId_idx" ON "RegistroAuditoria"("entidad", "entidadId");
CREATE INDEX "RegistroAuditoria_usuarioSistemaId_idx" ON "RegistroAuditoria"("usuarioSistemaId");
CREATE INDEX "RegistroAuditoria_creadoEn_idx" ON "RegistroAuditoria"("creadoEn");
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioSistemaId_fkey" FOREIGN KEY ("usuarioSistemaId") REFERENCES "UsuarioSistema"("id") ON DELETE SET NULL ON UPDATE CASCADE;
