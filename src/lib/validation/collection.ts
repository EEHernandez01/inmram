import { z } from "zod";

import { EstadoRecibo, FormaPago } from "@/generated/prisma/enums";

export const receiptPeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un periodo válido.");

export const receiptStatusFilterSchema = z.enum(EstadoRecibo).optional();

export const paymentInputSchema = z.object({
  fechaPago: z.iso.date(),
  formaPago: z.enum(FormaPago),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;

