-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('DUENO', 'ADMINISTRADOR', 'SOLO_LECTURA');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('DEPARTAMENTO', 'LOCAL_COMERCIAL', 'ACCESORIA', 'BODEGA', 'OFICINA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('ACTIVO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoRecibo" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "UsuarioSistema" (
    "id" UUID NOT NULL,
    "neonAuthUserId" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'SOLO_LECTURA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" UUID NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "logoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propietario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" UUID NOT NULL,
    "propietarioId" UUID NOT NULL,
    "marcaId" UUID,
    "direccion" TEXT NOT NULL,
    "valorCatastral" DECIMAL(14,2) NOT NULL,
    "valorComercialTotal" DECIMAL(14,2) NOT NULL,
    "predialAnual" DECIMAL(14,2) NOT NULL,
    "mantenimientoAnual" DECIMAL(14,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidad" (
    "id" UUID NOT NULL,
    "propiedadId" UUID NOT NULL,
    "identificador" TEXT NOT NULL,
    "tipo" "TipoUnidad" NOT NULL,
    "metrosCuadrados" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "piso" TEXT,
    "atributos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedidorAgua" (
    "id" UUID NOT NULL,
    "unidadId" UUID NOT NULL,
    "cuotaFija" DECIMAL(14,2) NOT NULL,
    "tarifaPorMetroCubico" DECIMAL(14,4) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedidorAgua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaAgua" (
    "id" UUID NOT NULL,
    "medidorAguaId" UUID NOT NULL,
    "periodo" DATE NOT NULL,
    "lecturaAnterior" DECIMAL(12,3) NOT NULL,
    "lecturaActual" DECIMAL(12,3) NOT NULL,
    "metrosCubicosConsumidos" DECIMAL(12,3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LecturaAgua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" UUID NOT NULL,
    "unidadId" UUID NOT NULL,
    "arrendatario" TEXT NOT NULL,
    "aval" TEXT NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "plazoMeses" INTEGER NOT NULL,
    "fechaFin" DATE NOT NULL,
    "rentaMensualBase" DECIMAL(14,2) NOT NULL,
    "diaPago" INTEGER NOT NULL,
    "depositoGarantia" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "periodo" DATE NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "estatus" "EstadoRecibo" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" DATE,
    "formaPago" "FormaPago",
    "cargoAgua" DECIMAL(14,2),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteInflacion" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "fechaAplicacion" DATE NOT NULL,
    "indiceUsado" TEXT NOT NULL,
    "porcentajeAplicado" DECIMAL(9,6) NOT NULL,
    "rentaResultante" DECIMAL(14,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjusteInflacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndiceInflacion" (
    "id" UUID NOT NULL,
    "indice" TEXT NOT NULL,
    "mes" DATE NOT NULL,
    "valor" DECIMAL(18,8) NOT NULL,
    "fechaCorte" DATE NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndiceInflacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSistema_neonAuthUserId_key" ON "UsuarioSistema"("neonAuthUserId");

-- CreateIndex
CREATE INDEX "Propiedad_propietarioId_idx" ON "Propiedad"("propietarioId");

-- CreateIndex
CREATE INDEX "Propiedad_marcaId_idx" ON "Propiedad"("marcaId");

-- CreateIndex
CREATE INDEX "Unidad_propiedadId_idx" ON "Unidad"("propiedadId");

-- CreateIndex
CREATE INDEX "Unidad_tipo_idx" ON "Unidad"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Unidad_propiedadId_identificador_key" ON "Unidad"("propiedadId", "identificador");

-- CreateIndex
CREATE UNIQUE INDEX "MedidorAgua_unidadId_key" ON "MedidorAgua"("unidadId");

-- CreateIndex
CREATE INDEX "LecturaAgua_periodo_idx" ON "LecturaAgua"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "LecturaAgua_medidorAguaId_periodo_key" ON "LecturaAgua"("medidorAguaId", "periodo");

-- CreateIndex
CREATE INDEX "Contrato_unidadId_idx" ON "Contrato"("unidadId");

-- CreateIndex
CREATE INDEX "Contrato_estado_idx" ON "Contrato"("estado");

-- CreateIndex
CREATE INDEX "Contrato_fechaFin_idx" ON "Contrato"("fechaFin");

-- CreateIndex
CREATE INDEX "Recibo_contratoId_idx" ON "Recibo"("contratoId");

-- CreateIndex
CREATE INDEX "Recibo_periodo_idx" ON "Recibo"("periodo");

-- CreateIndex
CREATE INDEX "Recibo_estatus_idx" ON "Recibo"("estatus");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_contratoId_periodo_key" ON "Recibo"("contratoId", "periodo");

-- CreateIndex
CREATE INDEX "AjusteInflacion_contratoId_idx" ON "AjusteInflacion"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "AjusteInflacion_contratoId_fechaAplicacion_key" ON "AjusteInflacion"("contratoId", "fechaAplicacion");

-- CreateIndex
CREATE INDEX "IndiceInflacion_mes_idx" ON "IndiceInflacion"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "IndiceInflacion_indice_mes_key" ON "IndiceInflacion"("indice", "mes");

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedidorAgua" ADD CONSTRAINT "MedidorAgua_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaAgua" ADD CONSTRAINT "LecturaAgua_medidorAguaId_fkey" FOREIGN KEY ("medidorAguaId") REFERENCES "MedidorAgua"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteInflacion" ADD CONSTRAINT "AjusteInflacion_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reglas de integridad del dominio
ALTER TABLE "Propiedad"
ADD CONSTRAINT "Propiedad_importes_no_negativos_check"
CHECK (
    "valorCatastral" >= 0
    AND "valorComercialTotal" >= 0
    AND "predialAnual" >= 0
    AND "mantenimientoAnual" >= 0
);

ALTER TABLE "Unidad"
ADD CONSTRAINT "Unidad_metrosCuadrados_positivos_check"
CHECK ("metrosCuadrados" > 0);

ALTER TABLE "MedidorAgua"
ADD CONSTRAINT "MedidorAgua_tarifas_no_negativas_check"
CHECK ("cuotaFija" >= 0 AND "tarifaPorMetroCubico" >= 0);

ALTER TABLE "LecturaAgua"
ADD CONSTRAINT "LecturaAgua_periodo_mensual_check"
CHECK (EXTRACT(DAY FROM "periodo") = 1),
ADD CONSTRAINT "LecturaAgua_lecturas_coherentes_check"
CHECK (
    "lecturaAnterior" >= 0
    AND "lecturaActual" >= "lecturaAnterior"
    AND "metrosCubicosConsumidos" = "lecturaActual" - "lecturaAnterior"
);

ALTER TABLE "Contrato"
ADD CONSTRAINT "Contrato_plazo_positivo_check"
CHECK ("plazoMeses" > 0),
ADD CONSTRAINT "Contrato_fechas_coherentes_check"
CHECK ("fechaFin" > "fechaInicio"),
ADD CONSTRAINT "Contrato_diaPago_valido_check"
CHECK ("diaPago" BETWEEN 1 AND 31),
ADD CONSTRAINT "Contrato_importes_no_negativos_check"
CHECK ("rentaMensualBase" >= 0 AND "depositoGarantia" >= 0);

CREATE UNIQUE INDEX "Contrato_unidad_activa_key"
ON "Contrato"("unidadId")
WHERE "estado" = 'ACTIVO';

ALTER TABLE "Recibo"
ADD CONSTRAINT "Recibo_periodo_mensual_check"
CHECK (EXTRACT(DAY FROM "periodo") = 1),
ADD CONSTRAINT "Recibo_importes_no_negativos_check"
CHECK ("monto" >= 0 AND ("cargoAgua" IS NULL OR "cargoAgua" >= 0)),
ADD CONSTRAINT "Recibo_pago_coherente_check"
CHECK (
    ("estatus" = 'PAGADO' AND "fechaPago" IS NOT NULL AND "formaPago" IS NOT NULL)
    OR
    ("estatus" <> 'PAGADO' AND "fechaPago" IS NULL AND "formaPago" IS NULL)
);

ALTER TABLE "AjusteInflacion"
ADD CONSTRAINT "AjusteInflacion_valores_validos_check"
CHECK ("porcentajeAplicado" > -1 AND "rentaResultante" >= 0);

ALTER TABLE "IndiceInflacion"
ADD CONSTRAINT "IndiceInflacion_mes_normalizado_check"
CHECK (EXTRACT(DAY FROM "mes") = 1),
ADD CONSTRAINT "IndiceInflacion_fechaCorte_check"
CHECK (EXTRACT(DAY FROM "fechaCorte") = 10),
ADD CONSTRAINT "IndiceInflacion_valor_positivo_check"
CHECK ("valor" > 0);
