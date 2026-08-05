import "server-only";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { registrarAuditoria } from "@/lib/services/audit";
import { recordIdSchema } from "@/lib/validation/foundation";

export async function enviarRecordatorioRecibo(receiptId: string) {
  const { user, session } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(receiptId);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new DomainError("EMAIL_NOT_CONFIGURED", "Configura RESEND_API_KEY y NOTIFICATION_FROM_EMAIL para enviar correos.");
  const receipt = await prisma.recibo.findUnique({ where: { id }, include: { contrato: { include: { unidad: { include: { propiedad: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  if (!receipt.contrato.emailArrendatario) throw new DomainError("MISSING_TENANT_EMAIL", "El contrato no tiene correo del arrendatario.");
  const total = Number(receipt.monto) + Number(receipt.cargoAgua ?? 0);
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": `recibo-${id}-${new Date().toISOString().slice(0, 10)}`, "user-agent": "cobranza-rentas/1.0" }, body: JSON.stringify({ from, to: [receipt.contrato.emailArrendatario], subject: `Recordatorio de renta ${receipt.periodo.toISOString().slice(0, 7)}`, text: `Hola ${receipt.contrato.arrendatario}:\n\n${issuer} te recuerda el recibo administrativo de ${receipt.contrato.unidad.propiedad.direccion}, unidad ${receipt.contrato.unidad.identificador}.\nPeriodo: ${receipt.periodo.toISOString().slice(0, 7)}\nFecha límite: ${formatDate(receipt.fechaVencimiento)}\nTotal: ${formatCurrency(total)}\nEstado: ${receipt.estatus}.\n\nEste mensaje no es un CFDI ni comprobante fiscal.` }) });
  if (!response.ok) throw new DomainError("EMAIL_PROVIDER_ERROR", "El proveedor de correo no pudo enviar el recordatorio.");
  const result = await response.json() as { id?: string };
  await prisma.$transaction(async (tx) => registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "ENVIAR_RECORDATORIO", entidad: "Recibo", entidadId: id, despues: { proveedor: "Resend", mensajeId: result.id ?? null, destinatarioConfigurado: true } }));
  return result;
}
