-- El catálogo de propietarios deja de depender de una sola cuenta del sistema.
ALTER TABLE "Propietario"
  ADD COLUMN "telefono" TEXT,
  ADD COLUMN "correo" TEXT;

ALTER TABLE "UsuarioSistema"
  ADD COLUMN "propietarioId" UUID;

-- Los propietarios existentes asociados a administradores se preservan como
-- registros independientes. Solo las cuentas con rol PROPIETARIO conservan
-- un vínculo de acceso.
INSERT INTO "Propietario" ("id", "usuarioSistemaId", "nombre", "creadoEn", "actualizadoEn")
SELECT
  md5(random()::text || clock_timestamp()::text || usuario."id")::uuid,
  usuario."id",
  COALESCE(NULLIF(BTRIM(perfil."nombreCompleto"), ''), 'Propietario sin nombre'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "UsuarioSistema" AS usuario
LEFT JOIN "Propietario" AS propietario
  ON propietario."usuarioSistemaId" = usuario."id"
LEFT JOIN "PerfilUsuario" AS perfil
  ON perfil."usuarioSistemaId" = usuario."id"
WHERE usuario."rol" = 'PROPIETARIO'
  AND propietario."id" IS NULL;

UPDATE "UsuarioSistema" AS usuario
SET "propietarioId" = propietario."id"
FROM "Propietario" AS propietario
WHERE propietario."usuarioSistemaId" = usuario."id"
  AND usuario."rol" = 'PROPIETARIO';

ALTER TABLE "Propietario"
  DROP CONSTRAINT "Propietario_usuarioSistemaId_fkey";

DROP INDEX "Propietario_usuarioSistemaId_key";

ALTER TABLE "Propietario"
  DROP COLUMN "usuarioSistemaId";

ALTER TABLE "UsuarioSistema"
  DROP COLUMN "puedeSerPropietario";

CREATE INDEX "UsuarioSistema_propietarioId_idx"
  ON "UsuarioSistema"("propietarioId");

ALTER TABLE "UsuarioSistema"
  ADD CONSTRAINT "UsuarioSistema_propietarioId_fkey"
  FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
