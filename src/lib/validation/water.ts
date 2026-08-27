import { z } from "zod";

const amount = z.string().trim().regex(/^\d{1,12}(?:\.\d{1,4})?$/, "Captura un importe válido.");
const reading = z.string().trim().regex(/^\d{1,9}(?:\.\d{1,3})?$/, "Captura una lectura válida.");
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un periodo válido.");

export const waterMeterInputSchema = z.object({ unidadId: z.uuid(), cuotaFija: amount.optional().default("0"), tarifaPorMetroCubico: amount.optional().default("0") });
export const waterReadingInputSchema = z.object({ medidorAguaId: z.uuid(), periodo: month, lecturaAnterior: reading.optional(), lecturaActual: reading });
export function waterPeriodDate(value: string) { return new Date(`${value}-01T00:00:00.000Z`); }
