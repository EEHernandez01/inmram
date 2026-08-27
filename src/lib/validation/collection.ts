import { z } from "zod";

import { EstadoRecibo, FormaPago } from "../../generated/prisma/enums.ts";

export const receiptPeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un periodo válido.");

export const receiptStatusFilterSchema = z.enum(EstadoRecibo).optional();

export const paymentInputSchema = z.object({
  monto: z
    .string()
    .trim()
    .regex(/^\d{1,12}(?:\.\d{1,2})?$/, "Captura un importe válido.")
    .refine((value) => Number(value) > 0, "El pago debe ser mayor que cero."),
  fechaPago: z.iso.date(),
  formaPago: z.enum(FormaPago),
  referencia: z.string().trim().max(100, "La referencia excede la longitud permitida.").nullable().optional(),
});

export const paymentReversalInputSchema = z.object({
  motivo: z.string().trim().min(3, "Indica el motivo de la reversión.").max(500, "El motivo excede la longitud permitida."),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type PaymentReversalInput = z.infer<typeof paymentReversalInputSchema>;
