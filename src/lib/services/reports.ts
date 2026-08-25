import "server-only";

import { EstadoContrato } from "@/generated/prisma/enums";
import { getOwnerScope, requireSystemRole } from "@/lib/auth/authorization";
import { RolUsuario } from "@/generated/prisma/enums";
import { calculatePortfolioProfitability, calculateUnitProfitability } from "@/lib/calculations/profitability";
import { prisma } from "@/lib/db/prisma";
import { propertyReportFilterSchema } from "@/lib/validation/reports";

export async function obtenerReporteRentabilidad(propertyFilter?: unknown, allowOwner = false) {
  await requireSystemRole(allowOwner ? [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.PROPIETARIO, RolUsuario.SOLO_LECTURA] : [RolUsuario.ADMINISTRADOR, RolUsuario.GESTOR, RolUsuario.SOLO_LECTURA]);
  const ownerId = await getOwnerScope();
  const parsed = propertyReportFilterSchema.parse(propertyFilter);
  const propertyId = parsed || undefined;
  const [properties, options] = await Promise.all([
    prisma.propiedad.findMany({
      where: { id: propertyId, propietarioId: ownerId ?? undefined },
      orderBy: { direccion: "asc" },
      include: { unidades: { orderBy: { identificador: "asc" }, include: { contratos: { where: { estado: EstadoContrato.ACTIVO }, orderBy: { fechaInicio: "desc" }, take: 1 } } } },
    }),
    prisma.propiedad.findMany({ where: { propietarioId: ownerId ?? undefined }, orderBy: { direccion: "asc" }, select: { id: true, direccion: true } }),
  ]);

  const propertyReports = properties.map((property) => {
    const propertyArea = property.unidades.reduce((sum, unit) => sum + Number(unit.metrosCuadrados), 0);
    const units = property.unidades.map((unit) => {
      const contract = unit.contratos[0];
      const monthlyRent = contract ? Number(contract.rentaMensualBase) : 0;
      const metrics = calculateUnitProfitability({
        monthlyRent,
        unitArea: Number(unit.metrosCuadrados),
        propertyArea,
        propertyAnnualTax: Number(property.predialAnual),
        propertyAnnualMaintenance: Number(property.mantenimientoAnual),
        propertyCommercialValue: Number(property.valorComercialTotal),
      });
      return { id: unit.id, identificador: unit.identificador, tipo: unit.tipo, metrosCuadrados: Number(unit.metrosCuadrados), tieneContratoActivo: Boolean(contract), ...metrics, monthlyRent };
    });
    const monthlyRent = units.reduce((sum, unit) => sum + unit.monthlyRent, 0);
    const monthlyExpenses = propertyArea > 0 ? (Number(property.predialAnual) + Number(property.mantenimientoAnual)) / 12 : 0;
    return { id: property.id, direccion: property.direccion, units, propertyArea, ...calculatePortfolioProfitability(monthlyRent, monthlyExpenses, Number(property.valorComercialTotal)) };
  });

  const portfolio = calculatePortfolioProfitability(
    propertyReports.reduce((sum, property) => sum + property.monthlyRent, 0),
    propertyReports.reduce((sum, property) => sum + property.monthlyExpenses, 0),
    propertyReports.reduce((sum, property) => sum + property.commercialValue, 0),
  );
  return { properties: propertyReports, propertyOptions: options, portfolio };
}
