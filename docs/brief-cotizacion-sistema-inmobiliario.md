# Brief de alcance para cotizar una plataforma de gestión de rentas

## Qué necesito cotizar

Quiero una estimación orientativa para desarrollar una aplicación web administrativa para una empresa inmobiliaria que gestiona propiedades en renta. Por ahora compartiré únicamente este brief; no estoy dando acceso al código. La cotización debe basarse en el alcance descrito y señalar qué dudas o decisiones podrían cambiar el precio.

Pido separar dos escenarios: (1) desarrollar desde cero una solución con este alcance; y (2) como opción futura, revisar una aplicación existente y estimar cuánto costaría completarla. El segundo escenario requeriría una demostración o acceso al código más adelante; no hace falta para dar una primera estimación del escenario 1.

## Usuarios y objetivo

La plataforma centraliza información de propietarios, inmuebles, unidades, contratos y cobros. Se usaría desde navegador para llevar la operación de rentas y consultar el estado de la cartera.

Se contemplan distintos permisos: administrador, gestor, propietario y solo lectura. Se necesita confirmar con el cliente qué información puede consultar o modificar cada tipo de usuario, en particular si cada propietario tendrá acceso propio a sus propiedades y reportes.

## Alcance funcional solicitado

### 1. Propietarios y propiedades

- Registrar propietarios y sus datos de contacto.
- Registrar propiedades con domicilio, ubicación, propietario, valores del inmueble y costos anuales relacionados.
- Adjuntar fotografías y documentos del expediente.
- Organizar cada inmueble en unidades como departamentos, locales, bodegas u oficinas.
- Registrar características de cada unidad, como superficie, descripción, habitaciones, baños y amenidades.
- Apoyar la captura de ubicación en mapa y detectar posibles propiedades duplicadas.
- Editar, archivar o unificar registros duplicados.

### 2. Contratos de arrendamiento

- Registrar unidad, arrendatario, contacto, aval, fechas, plazo, renta, día de pago y depósito.
- Registrar garantías y datos relacionados con pagarés.
- Definir frecuencia de cobro, incluyendo mensual, bimestral, semestral o anual.
- Consultar contratos activos, vencidos o cancelados.
- Registrar cancelaciones y su motivo.
- Dar seguimiento a renovaciones y proponer ajustes de renta por inflación.
- Adjuntar documentos relacionados con el contrato.

### 3. Cobranza, recibos y pagos

- Generar recibos administrativos de renta conforme al calendario del contrato.
- Consultar recibos pendientes, pagados, vencidos, omitidos o en revisión.
- Registrar pagos manuales en efectivo o transferencia, con fecha y referencia.
- Mantener historial de pagos y permitir registrar anulaciones con motivo.
- Generar PDFs de recibos y comprobantes administrativos.
- Enviar recordatorios de cobro por correo electrónico.
- Mostrar saldos y seguimiento de cobranza.

La aplicación no contempla, en el alcance conocido, procesar pagos en línea ni emitir CFDI. Favor de cotizar esas funciones como opcionales y por separado si se recomiendan.

### 4. Agua

- Configurar medidores asociados a unidades, cuota fija y tarifa por consumo.
- Capturar lecturas por periodo y calcular consumo y cargo de agua.
- Reflejar el cargo en el control del recibo correspondiente, según las reglas que se definan.

### 5. Inflación y ajustes de renta

- Consultar o registrar índices de inflación.
- Proponer el porcentaje de ajuste y la nueva renta de acuerdo con la regla definida para cada contrato.
- Conservar el historial de ajustes aplicados.

### 6. Reportes y administración

- Mostrar un tablero con información de operación y cobranza.
- Consultar reportes de rentabilidad de propiedades.
- Exportar listados de propiedades a Excel.
- Administrar usuarios y permisos.
- Mantener un registro de auditoría de cambios relevantes.

## Referencia técnica de la versión existente

La versión actual está construida con Next.js, React, TypeScript, PostgreSQL, Prisma y Neon. También utiliza Neon Auth, Vercel Blob para archivos, Resend para correo, Banxico para datos de inflación y Google Maps/Places para ubicación. Esta información puede servir para estimar la opción de continuar el desarrollo, pero no es requisito cambiar de tecnología sin explicar el impacto en costo y plazo.

## Qué debe incluir la cotización

Favor de estimar en pesos mexicanos y separar:

- Desarrollo desde cero del alcance descrito.
- Revisión y terminación de una versión existente, únicamente como estimación preliminar basada en este brief.
- Diseño de interfaz, pruebas, despliegue, migración/carga inicial de datos y capacitación.
- Costos recurrentes de base de datos, hosting, almacenamiento, correo, mapas y otros servicios.
- Garantía de corrección y mantenimiento posterior.
- Opcionales: CFDI, pagos en línea, aplicación móvil e integraciones externas.

Para cada escenario, indicar rango bajo, probable y alto; horas estimadas; duración calendario; entregables; supuestos; exclusiones; riesgos; forma de pago; e indicar si el precio incluye IVA.

## Mensaje listo para enviar

> Hola. Quiero pedirte una cotización preliminar para una plataforma web de gestión inmobiliaria y cobranza de rentas. Te comparto este brief con el alcance funcional; por ahora no estoy compartiendo el repositorio ni credenciales. ¿Podrías estimar cuánto costaría desarrollar desde cero una solución con este alcance, cuánto tardaría y qué incluirías en la entrega? Si es posible, agrega por separado una estimación muy preliminar para revisar y terminar una aplicación existente con estas funciones; esa segunda cifra podría ajustarse después de una demostración o revisión del código. Separa supuestos, exclusiones, opcionales, mantenimiento, costos mensuales e IVA.

## Datos que ayudarán a afinar la cotización

Si los conoces, agrega al pedir la cotización: número de propiedades, unidades, usuarios y recibos mensuales; quién necesita iniciar sesión; si propietarios y arrendatarios tendrán portal propio; volumen de datos que se debe importar; fecha objetivo; y presupuesto disponible. Si aún no lo sabes, pide al experto que deje esos puntos como supuestos y explique cuánto moverían el precio.

**Nota:** este brief permite una estimación preliminar de alcance. Para cerrar precio fijo de una aplicación existente, el experto necesitará ver una demostración y revisar el producto o el código. No compartas contraseñas, claves API ni datos reales de arrendatarios en la primera consulta.
