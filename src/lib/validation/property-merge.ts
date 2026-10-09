import { z } from "zod";

const coordinate = (limit: number) => z.string().trim()
  .regex(/^-?\d{1,3}(?:\.\d{1,6})?$/, "La ubicación seleccionada no es válida.")
  .refine((value) => Math.abs(Number(value)) <= limit, "La coordenada está fuera de rango.")
  .nullable();

export const ubicacionParaUnificarSchema = z.object({
  direccion: z.string().trim().min(1).max(500),
  googlePlaceId: z.string().trim().min(1).max(255).nullable(),
  latitud: coordinate(90),
  longitud: coordinate(180),
}).strict().refine((value) => (value.latitud === null) === (value.longitud === null), {
  message: "Selecciona nuevamente la ubicación en el mapa.",
});

export type UbicacionParaUnificar = z.infer<typeof ubicacionParaUnificarSchema>;
