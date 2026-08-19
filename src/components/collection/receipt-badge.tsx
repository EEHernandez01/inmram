import { EstadoRecibo } from "@/generated/prisma/enums";

const statusClasses = {
  PENDIENTE: "bg-warning-soft text-warning",
  PAGADO: "bg-success-soft text-success",
  VENCIDO: "bg-danger-soft text-danger",
} as const;

export const receiptStatusLabels = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  VENCIDO: "Vencido",
} as const;

export function ReceiptBadge({ status }: { status: EstadoRecibo }) {
  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {receiptStatusLabels[status]}
    </span>
  );
}
