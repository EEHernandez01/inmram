import { z } from "zod";

import { EstadoContrato, TipoUnidad } from "@/generated/prisma/enums";

const requiredText = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(250, "El texto excede la longitud permitida.");
const uuid = z.uuid();
const date = z.iso.date();

const money = z
  .string()
  .trim()
  .regex(/^\d{1,12}(?:\.\d{1,2})?$/, "Captura un importe válido.");

const coordinate = z
  .string()
  .trim()
  .regex(/^-?\d{1,3}(?:\.\d{1,6})?$/, "La ubicación seleccionada no es válida.")
  .nullable()
  .optional();

const positiveArea = z
  .string()
  .trim()
  .regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Captura una superficie válida.")
  .refine((value) => Number(value) > 0, "La superficie debe ser mayor que cero.");

export const propietarioInputSchema = z.object({
  nombre: requiredText,
});

export const perfilUsuarioInputSchema = z.object({
  nombreCompleto: requiredText,
  alias: z.string().trim().max(100).nullable().optional(),
  razonSocial: z.string().trim().max(250).nullable().optional(),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{10,20}$/, "Captura un teléfono válido.")
    .nullable()
    .optional(),
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Captura un RFC válido.")
    .nullable()
    .optional(),
});

export const usuarioAdministradorInputSchema = z.object({
  neonAuthUserId: z.string().trim().min(1).max(255),
});

export const propiedadInputSchema = z
  .object({
    propietarioId: uuid,
    marcaId: uuid.nullable().optional(),
    direccion: requiredText.max(500),
    googlePlaceId: z.string().trim().max(255).nullable().optional(),
    latitud: coordinate,
    longitud: coordinate,
    valorCatastral: money,
    valorComercialTotal: money,
    predialAnual: money,
    mantenimientoAnual: money,
  })
  .superRefine((input, context) => {
    if ((input.latitud === null) !== (input.longitud === null)) {
      context.addIssue({
        code: "custom",
        message: "Selecciona nuevamente la ubicación en el mapa.",
        path: ["direccion"],
      });
    }

    if (input.latitud !== null && Math.abs(Number(input.latitud)) > 90) {
      context.addIssue({ code: "custom", message: "La latitud no es válida.", path: ["latitud"] });
    }

    if (input.longitud !== null && Math.abs(Number(input.longitud)) > 180) {
      context.addIssue({ code: "custom", message: "La longitud no es válida.", path: ["longitud"] });
    }
  });

export const unidadInputSchema = z.object({
  propiedadId: uuid,
  identificador: requiredText.max(100),
  tipo: z.enum(TipoUnidad),
  metrosCuadrados: positiveArea,
  descripcion: z.string().trim().max(2_000).nullable().optional(),
  piso: z.string().trim().max(50).nullable().optional(),
  atributos: z.record(z.string(), z.json()).nullable().optional(),
  recamaras: z.coerce.number().int().min(0).max(50).default(0),
  banosCompletos: z.coerce.number().int().min(0).max(50).default(0),
  mediosBanos: z.coerce.number().int().min(0).max(50).default(0),
  amenidades: z.array(z.string().trim().min(1).max(100)).max(30).nullable().optional(),
});

export const contratoInputSchema = z
  .object({
    unidadId: uuid,
    arrendatario: requiredText,
    emailArrendatario: z.email("Captura un correo válido.").max(254).nullable().optional(),
    telefonoArrendatario: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/, "Captura un teléfono válido.").nullable().optional(),
    aval: requiredText,
    fechaInicio: date,
    plazoMeses: z.coerce.number().int().positive().max(1_200),
    fechaFin: date,
    rentaMensualBase: money,
    diaPago: z.coerce.number().int().min(1).max(31),
    depositoGarantia: money,
    cargoFijoMensual: money.optional().default("0.00"),
    avalTelefono: z.string().trim().regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Captura un teléfono válido.").nullable().optional(),
    avalCorreo: z.union([z.literal(""), z.email("Captura un correo válido.")]).nullable().optional(),
    estado: z.enum(EstadoContrato),
  })
  .superRefine((input, context) => {
    if (input.fechaFin <= input.fechaInicio) {
      context.addIssue({
        code: "custom",
        message: "La fecha final debe ser posterior a la fecha de inicio.",
        path: ["fechaFin"],
      });
    }
  });

export const recordIdSchema = uuid;

export type PropietarioInput = z.infer<typeof propietarioInputSchema>;
export type PerfilUsuarioInput = z.infer<typeof perfilUsuarioInputSchema>;
export type UsuarioAdministradorInput = z.infer<typeof usuarioAdministradorInputSchema>;
export type PropiedadInput = z.infer<typeof propiedadInputSchema>;
export type UnidadInput = z.infer<typeof unidadInputSchema>;
export type ContratoInput = z.infer<typeof contratoInputSchema>;

export function toDatabaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
