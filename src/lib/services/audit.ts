import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

type AuditClient = Prisma.TransactionClient;

export function registrarAuditoria(client: AuditClient, input: { usuarioSistemaId?: string | null; accion: string; entidad: string; entidadId: string; antes?: Prisma.InputJsonValue; despues?: Prisma.InputJsonValue }) {
  return client.registroAuditoria.create({ data: { usuarioSistemaId: input.usuarioSistemaId, accion: input.accion, entidad: input.entidad, entidadId: input.entidadId, antes: input.antes, despues: input.despues } });
}

export async function listarAuditoria() {
  await requireSystemRole(ADMIN_ROLES);
  return prisma.registroAuditoria.findMany({ take: 100, orderBy: { creadoEn: "desc" }, include: { usuarioSistema: { include: { perfil: true } } } });
}
