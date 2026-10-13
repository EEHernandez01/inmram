import { EstadoContrato } from "@/generated/prisma/enums";
import { getOwnerScope } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createXlsx } from "@/lib/exports/xlsx";
import { safeRouteError } from "@/lib/http/route-security";
import { listarPropiedades } from "@/lib/services/foundation";

const availabilityOptions = ["TODAS", "CON_DISPONIBILIDAD", "SIN_DISPONIBILIDAD"] as const;
const orderOptions = ["DIRECCION_ASC", "DIRECCION_DESC", "DISPONIBILIDAD_DESC", "VALOR_DESC", "VALOR_ASC"] as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const availability = params.get("disponibilidad");
  const order = params.get("ordenar");

  try {
    const [propertyResult, ownerId] = await Promise.all([
      listarPropiedades({
        archivadas: false,
        busqueda: params.get("buscar")?.trim().slice(0, 100) || undefined,
        propietarioId: params.get("propietario") || undefined,
        disponibilidad: availabilityOptions.includes(availability as typeof availabilityOptions[number]) ? availability as typeof availabilityOptions[number] : "TODAS",
        orden: orderOptions.includes(order as typeof orderOptions[number]) ? order as typeof orderOptions[number] : "DIRECCION_ASC",
      }),
      getOwnerScope(),
    ]);
    const properties = propertyResult.propiedades;
    const units = properties.length ? await prisma.unidad.findMany({
      where: { propiedadId: { in: properties.map((property) => property.id) }, propietarioId: ownerId ?? undefined },
      orderBy: [{ propiedad: { direccion: "asc" } }, { identificador: "asc" }],
      include: {
        propiedad: { select: { direccion: true } },
        propietario: { select: { nombre: true } },
        contratos: { where: { estado: EstadoContrato.ACTIVO }, select: { id: true }, take: 1 },
      },
    }) : [];
    const workbook = createXlsx([
      { name: "Propiedades", rows: [
        ["Dirección", "Unidad", "Propietario", "Tipo", "m²", "Piso", "Recámaras", "Baños completos", "Medios baños", "Disponibilidad"],
        ...units.map((unit) => [unit.propiedad.direccion, unit.identificador, unit.propietario.nombre, unit.tipo, Number(unit.metrosCuadrados), unit.piso ?? "", unit.recamaras, unit.banosCompletos, unit.mediosBanos, unit.contratos.length ? "Ocupada" : "Disponible"]),
      ] },
    ]);

    return new Response(workbook, { headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="Propiedades.xlsx"',
    } });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
