import { RolUsuario } from "../../generated/prisma/enums.ts";
import { z } from "zod";

const requiredText = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(250, "El texto excede la longitud permitida.");
const uuid = z.uuid();

const optionalPhone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/, "Captura un teléfono válido.").nullable().optional(),
);

const optionalEmail = z.preprocess(
  (value) => typeof value === "string" ? value.trim() || null : value,
  z.email("Captura un correo válido.").max(254).nullable().optional(),
);

export const propietarioInputSchema = z.object({
  nombre: requiredText,
  telefono: optionalPhone,
  correo: optionalEmail,
});

export const propietarioCuentaSchema = z
  .object({
    rol: z.enum(RolUsuario),
    propietarioId: z.preprocess(
      (value) => typeof value === "string" && value.trim() === "" ? null : value,
      uuid.nullable().optional(),
    ),
  })
  .superRefine((input, context) => {
    if (input.rol === RolUsuario.PROPIETARIO && !input.propietarioId) {
      context.addIssue({
        code: "custom",
        message: "Selecciona un propietario para la cuenta.",
        path: ["propietarioId"],
      });
    }

    if (input.rol !== RolUsuario.PROPIETARIO && input.propietarioId) {
      context.addIssue({
        code: "custom",
        message: "Solo las cuentas con rol Propietario pueden vincularse a un propietario.",
        path: ["propietarioId"],
      });
    }
  });

export type PropietarioInput = z.infer<typeof propietarioInputSchema>;
export type PropietarioCuentaInput = z.infer<typeof propietarioCuentaSchema>;
