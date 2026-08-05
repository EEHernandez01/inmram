import { z } from "zod";

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un mes válido.");
const indexName = z.string().trim().min(1).max(50).default("INPC");

export const inflationIndexInputSchema = z.object({
  indice: indexName,
  mes: month,
  valor: z.string().trim().regex(/^\d{1,6}(?:\.\d{1,8})?$/, "Captura un nivel oficial válido.").refine((value) => Number(value) > 0, "El nivel debe ser mayor que cero."),
  fechaCorte: z.iso.date(),
}).superRefine((input, context) => {
  if (!input.fechaCorte.endsWith("-10")) context.addIssue({ code: "custom", message: "La fecha de corte debe ser el día 10.", path: ["fechaCorte"] });
  if (input.fechaCorte.slice(0, 7) !== input.mes) context.addIssue({ code: "custom", message: "La fecha de corte debe corresponder al mes capturado.", path: ["fechaCorte"] });
});

export const renewalInputSchema = z.object({
  indice: indexName,
  mesBase: month,
  mesFinal: month,
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
  plazoMeses: z.coerce.number().int().positive().max(1200),
}).superRefine((input, context) => {
  if (input.mesFinal <= input.mesBase) context.addIssue({ code: "custom", message: "El mes final debe ser posterior al mes base.", path: ["mesFinal"] });
  if (input.fechaFin <= input.fechaInicio) context.addIssue({ code: "custom", message: "La fecha final debe ser posterior al inicio.", path: ["fechaFin"] });
});

export const inflationYearSchema = z.coerce.number().int().min(1900).max(2200);

export function inflationMonthDate(value: string) { return new Date(`${value}-01T00:00:00.000Z`); }
export function inflationDate(value: string) { return new Date(`${value}T00:00:00.000Z`); }
