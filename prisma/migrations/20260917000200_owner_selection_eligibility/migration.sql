-- La cuenta administrativa puede conservar acceso sin ofrecerse como dueño.
ALTER TABLE "UsuarioSistema"
ADD COLUMN "puedeSerPropietario" BOOLEAN NOT NULL DEFAULT true;
