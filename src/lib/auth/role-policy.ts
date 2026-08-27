import { RolUsuario, type RolUsuario as RolUsuarioType } from "../../generated/prisma/enums.ts";

export const ADMIN_ROLES = [RolUsuario.ADMINISTRADOR] as const;
export const OPERATION_ROLES = [
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GESTOR,
] as const;
export const READ_ROLES = [
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GESTOR,
  RolUsuario.PROPIETARIO,
  RolUsuario.SOLO_LECTURA,
] as const;
export const REPORT_ROLES = READ_ROLES;

export function canManageOperations(role: RolUsuarioType) {
  return OPERATION_ROLES.includes(
    role as (typeof OPERATION_ROLES)[number],
  );
}

export function canViewReports(role: RolUsuarioType) {
  return REPORT_ROLES.includes(role as (typeof REPORT_ROLES)[number]);
}
