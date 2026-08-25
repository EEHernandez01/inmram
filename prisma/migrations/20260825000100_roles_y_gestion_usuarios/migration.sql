-- Renombra los roles existentes sin perder los usuarios ya registrados.
ALTER TYPE "RolUsuario" RENAME VALUE 'DUENO' TO 'ADMINISTRADOR_GENERAL';
ALTER TYPE "RolUsuario" RENAME VALUE 'ADMINISTRADOR' TO 'ASISTENTE';
ALTER TYPE "RolUsuario" ADD VALUE 'PROPIETARIO';
