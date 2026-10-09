import { z } from "zod";

import { propietarioInputSchema } from "./owners.ts";

const dataBagSchema = z.object({}).passthrough();

export const propietarioExistenteEnAsistenteSchema = z.object({
  modo: z.literal("EXISTENTE"),
  propietarioId: z.uuid(),
});

export const propietarioNuevoEnAsistenteSchema = z.object({
  modo: z.literal("NUEVO"),
  propietario: propietarioInputSchema,
});

export const referenciaPropietarioEnAsistenteSchema = z.discriminatedUnion("modo", [
  propietarioExistenteEnAsistenteSchema,
  propietarioNuevoEnAsistenteSchema,
]);

export const referenciaPropietarioUnidadEnAsistenteSchema = z.union([
  referenciaPropietarioEnAsistenteSchema,
  z.object({ modo: z.literal("PRINCIPAL") }),
]);

const nuevaPropiedadAsistidaSchema = z.object({
  propiedad: dataBagSchema,
  propietario: referenciaPropietarioEnAsistenteSchema,
  unidades: z.array(z.object({
    datos: dataBagSchema,
    propietario: referenciaPropietarioUnidadEnAsistenteSchema,
    contrato: dataBagSchema.nullable(),
  })),
}).strict();

export const altaPropiedadAsistidaSchema = z.union([
  nuevaPropiedadAsistidaSchema,
  nuevaPropiedadAsistidaSchema.extend({
    propiedadExistenteId: z.uuid(),
    propietario: referenciaPropietarioEnAsistenteSchema.optional(),
    unidades: nuevaPropiedadAsistidaSchema.shape.unidades.min(1, "Agrega al menos una unidad a la propiedad existente."),
  }).strict(),
]);

export type AltaPropiedadAsistida = z.infer<typeof altaPropiedadAsistidaSchema>;
export type ReferenciaPropietarioEnAsistente = z.infer<typeof referenciaPropietarioEnAsistenteSchema>;
export type ReferenciaPropietarioUnidadEnAsistente = z.infer<typeof referenciaPropietarioUnidadEnAsistenteSchema>;
