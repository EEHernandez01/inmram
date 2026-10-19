import { z } from "zod";

export const monthlyPaymentReportSchema = z.object({
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  cliente: z.string().trim().max(120).optional(),
  propiedad: z.union([z.literal(""), z.uuid()]).optional(),
  unidad: z.union([z.literal(""), z.uuid()]).optional(),
});

export type MonthlyPaymentReportFilters = z.infer<typeof monthlyPaymentReportSchema>;
