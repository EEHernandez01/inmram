# Plan de Desarrollo — Sistema de Control y Automatización de Cobranza de Rentas

**Stack:** Next.js 14+ (App Router) · React · TypeScript · Tailwind CSS
**Objetivo:** Automatizar cobranza mensual, control de inflación/renovación de contratos y análisis de rentabilidad de un portafolio de propiedades en renta.

---

## 1. Resumen ejecutivo

El sistema no es solo un "CRUD de propiedades": es un motor de cálculo. Los 12 puntos que enviaste se dividen en dos categorías:

- **Datos maestros** (se capturan una vez, se editan poco): dirección, contrato, arrendador, aval, m², descripción.
- **Datos operativos/calculados** (se generan automáticamente cada mes o año): recibos, inflación, renta ajustada, predial prorrateado, rentabilidad.

La arquitectura se diseña para que lo segundo dependa de lo primero sin intervención manual — ese es el corazón de la "automatización".

---

## 2. Modelo de datos (entidades)

Un punto crítico que corrige el modelo inicial: **una propiedad (edificio/predio) no es la unidad rentable — la unidad individual sí lo es.** Y esa unidad no siempre es un departamento: puede ser un local comercial, una accesoria, una bodega, un despacho, etc. Todas comparten la misma lógica de contrato/renta/cobranza, pero difieren en algunos atributos propios de su uso.

Por eso se agrega una capa intermedia genérica: **Unidad**, entre Propiedad y Contrato, con un campo `tipo` que la distingue.

```
Marca/Empresa (opcional — para branding en recibos/reportes)
 └─ nombre comercial, logo

Propietario (Arrendador)
 └─ Propiedad (1:N)                         ← el edificio/predio físico
     ├─ dirección, valor_catastral, predial_anual, mantenimiento_anual (del predio completo)
     └─ Unidad (1:N)                        ← cualquier espacio rentable
         ├─ número/identificador (101, Local-A, Accesoria-2...)
         ├─ tipo: departamento | local_comercial | accesoria | bodega | oficina | otro
         ├─ m², descripción, piso
         ├─ atributos específicos según tipo (ver abajo)
         ├─ Medidor de agua (0:1, opcional)
         │   └─ LecturaAgua (1:N, una por mes): lectura_anterior, lectura_actual, m³_consumidos
         └─ Contrato (1:N histórico — activos y vencidos)
             ├─ arrendatario, aval, fecha_inicio, plazo_meses, fecha_fin
             ├─ renta_mensual_base, día_de_pago, depósito_garantía
             ├─ Recibo (1:N, uno por mes)
             │   ├─ periodo, monto, estatus (pendiente/pagado/vencido), fecha_pago
             │   ├─ forma_pago: efectivo | transferencia
             │   └─ cargo_agua (opcional, si la unidad tiene medidor — ver 3.9)
             └─ AjusteInflacion (1:N, uno por renovación/año)
                 ├─ índice_usado (INPC u otro), % aplicado, renta_resultante
```

**Sobre la Marca/Empresa:** si administras propiedades bajo más de un nombre comercial (ej. "Inmobiliaria Ramos"), conviene que cada Propiedad (o cada Contrato) referencie una Marca, y que el PDF del recibo tome de ahí el logo y nombre a mostrar — así generas recibos con identidad distinta sin duplicar el sistema completo.

**Atributos específicos por tipo (opcionales, solo aplican según `tipo`):**

| Tipo de unidad | Atributos adicionales útiles |
|---|---|
| Departamento | recámaras, baños, amueblado (sí/no) |
| Local comercial | giro del negocio, uso de suelo, si tiene sanitario propio, fachada/acceso a calle |
| Accesoria | giro permitido, si comparte servicios con la propiedad principal |
| Bodega | altura libre, acceso vehicular, capacidad de carga |
| Oficina | número de estaciones/cubículos, si incluye recepción compartida |

En la base de datos esto se maneja bien con un campo `tipo` (enum) más un campo `atributos` en formato JSON flexible — así no necesitas una tabla distinta por cada tipo de unidad, pero puedes capturar lo relevante de cada una sin forzar campos vacíos en las que no aplican.

**Por qué generalizar "Unidad" en vez de tener tablas separadas (Departamentos, Locales, etc.):** toda la lógica de cobranza, contrato, recibo e inflación es idéntica sin importar si es un depa o un local — solo cambia la ficha descriptiva. Si separaras las tablas, duplicarías la lógica de Contrato/Recibo/Cálculo en cada una, lo cual rompe la escalabilidad que buscas.

**Por qué esta capa intermedia y no meter todo en Propiedad:**
- El **predial** (punto 11) casi siempre se paga por el predio completo, no por unidad — necesitas prorratearlo entre unidades (ver 3.5).
- La **rentabilidad** (punto 12) se vuelve mucho más útil calculada por unidad, no solo por edificio: te dice qué unidad específica rinde bien y cuál no, sin importar si es depa o local, aunque estén en la misma dirección.
- El **historial de contratos vencidos** (punto 10) debe amarrarse a la unidad, no a la propiedad completa.
- Si en el futuro rentas una propiedad de una sola unidad (una casa o un local independiente), simplemente esa Propiedad tiene una única Unidad — el modelo no se rompe, solo se simplifica.

**Por qué separar Contrato de Unidad:** una unidad puede tener varios contratos a lo largo del tiempo. Si guardas la renta directamente en la unidad, pierdes el histórico. Con esta relación, el histórico es automático: nunca se borra un contrato, solo se marca `vencido`.

---

## 3. Qué calcular, cómo y por qué

Esta es la parte que convierte el sistema de "base de datos" a "herramienta de decisión". Para cada dato calculado explico la fórmula y el motivo de negocio.

### 3.1 Recibo mensual automático
- **Cómo:** un cron job (Vercel Cron o similar) corre el día 1 de cada mes y genera un registro `Recibo` por cada contrato activo, con `monto = renta_mensual_vigente` y `estatus = pendiente`.
- **Por qué:** elimina el trabajo manual de "acordarme de generar el recibo" y da una fuente única de verdad para saber quién debe qué mes.

### 3.2 Estatus de cobranza y morosidad
- **Cómo:** comparar `fecha_actual` vs `día_de_pago + tolerancia`. Si no hay pago registrado, el recibo pasa a `vencido` automáticamente. Se calcula `días_de_atraso = fecha_actual - fecha_límite_pago`.
- **Por qué:** te da visibilidad inmediata de quién está atrasado sin revisar contrato por contrato — es el núcleo del "control de cobranza".

### 3.3 Índice de inflación acumulada (para renovación)
- **Cómo:** capturas mensualmente el INPC (o el índice que uses) en una tabla `IndiceInflacion(mes, valor, fecha_corte)`, con **corte fijo el día 10 de cada mes** (regla de negocio: el índice se alimenta con el dato disponible a esa fecha, para tener consistencia mes a mes). Al llegar la fecha de renovación:

  ```
  inflación_acumulada = Π(1 + inflación_mensual_i) − 1   (para i = mes 1 hasta mes 12)
  nueva_renta = renta_actual × (1 + inflación_acumulada)
  ```

  Además, se genera un **reporte anual de inflación**: consolidado de los 12 valores mensuales capturados + el acumulado del año, exportable para consulta o para justificar el ajuste ante el inquilino.

- **Por qué:** en México la práctica común es ajustar renta anual con INPC. Automatizarlo evita negociar "a ojo" y te da un número defendible con el inquilino. Fijar el corte el día 10 evita inconsistencias si capturas el dato en fechas distintas cada mes.

### 3.4 Renta sugerida en renovación (punto 8)
- **Cómo:** además de la inflación pura, se puede ofrecer una comparación contra precio de mercado (m² × precio/m² promedio de la zona, si decides alimentar ese dato). El sistema muestra ambos números: `renta_por_inflación` vs `renta_de_mercado_estimada`, y tú decides.
- **Por qué:** la inflación protege tu poder adquisitivo, pero no siempre refleja el mercado real; mostrar ambos te da mejor negociación.

### 3.5 Predial mensualizado y prorrateado por unidad (punto 11)
- **Cómo:** el predial se paga a nivel Propiedad (predio completo), pero para calcular rentabilidad necesitas su parte proporcional por unidad:

  ```
  predial_mensual_propiedad = predial_anual / 12
  predial_mensual_unidad = predial_mensual_propiedad × (m²_unidad / m²_totales_propiedad)
  ```

  Si no quieres prorratear por m², una alternativa simple es dividir entre el número de unidades (`/ total_unidades`) — más fácil de calcular, aunque menos preciso si las unidades tienen tamaños distintos.

- **Por qué:** el predial es anual y por predio completo, pero tus ingresos y tu análisis de rentabilidad son mensuales y por unidad; prorratearlo correctamente te permite comparar peras con peras al calcular el margen real de cada departamento.

### 3.6 Rentabilidad mensual y anual (punto 12)
- **Cómo (por unidad, y agregable por propiedad/portafolio):**

  ```
  gastos_mensuales_unidad = predial_mensual_unidad + mantenimiento_mensual_unidad + otros_gastos
  ingreso_mensual_neto = renta_mensual − gastos_mensuales_unidad
  rentabilidad_mensual (%) = ingreso_mensual_neto / valor_estimado_unidad × 100
  rentabilidad_anual (%)  = (ingreso_mensual_neto × 12) / valor_estimado_unidad × 100
  ```

  Donde `mantenimiento_mensual_unidad = mantenimiento_anual_propiedad / 12`, prorrateado igual que el predial (por m² o entre número de unidades — ver 3.5).

  **Rentabilidad por m² (nueva métrica solicitada):**

  ```
  rentabilidad_por_m2 = ingreso_mensual_neto / m²_unidad
  renta_por_m2 = renta_mensual / m²_unidad
  ```

  Esta métrica es más útil que el % puro para **comparar unidades de distinto tamaño entre sí**: te dice si un local de 40 m² realmente rinde mejor que un depa de 80 m², independientemente de su valor comercial.

  A nivel **Propiedad** (edificio completo), simplemente sumas el ingreso neto de todas sus unidades y lo divides entre el valor total del predio. Así obtienes tanto el detalle fino (¿qué unidad rinde mejor?) como la vista consolidada (¿qué tan bien rinde el edificio completo?).

  También conviene calcular **cap rate** (rendimiento sobre valor de mercado) y **rentabilidad bruta** (sin descontar gastos), para tener ambas lecturas.

  **Reporte de rentabilidad filtrable por dirección y por arrendador:** el reporte debe permitir agrupar/filtrar tanto por propiedad (dirección) como por arrendador — útil si tienes propiedades a nombre de distintas personas/entidades y quieres ver la rentabilidad consolidada de cada una por separado.

- **Por qué:** calcularlo por unidad te dice qué unidades específicas realmente te convienen y cuáles apenas cubren gastos — información que se pierde si solo ves el edificio como un bloque. Es clave para decidir si remodelas, vendes o ajustas renta de una unidad en particular. Filtrar por arrendador te da la foto fiscal/legal correcta si el patrimonio está repartido entre distintas personas.

### 3.7 Días promedio de cobro / tasa de morosidad del portafolio
- **Cómo:** `% morosidad = (recibos_vencidos / recibos_totales_del_mes) × 100`, agregable por propiedad o global.
- **Por qué:** métrica de salud del negocio completo, útil para decisiones como exigir aval más fuerte o depósito mayor en próximos contratos.

### 3.8 Alertas de vencimiento de contrato
- **Cómo:** cron diario que revisa `fecha_fin − fecha_actual`; dispara alerta a 90/60/30 días.
- **Por qué:** evita renovaciones tardías o inquilinos que se quedan sin contrato vigente.

### 3.9 Cargo de agua por medidor (dato nuevo)
- **Cómo:** cada Unidad con medidor propio registra una lectura mensual. El cargo se calcula:

  ```
  m³_consumidos = lectura_actual − lectura_anterior
  cargo_agua = cuota_fija + (m³_consumidos × tarifa_por_m³)
  ```

  Este cargo se puede sumar al recibo mensual de renta (como concepto adicional) o generarse como recibo independiente, según prefieras.

- **Por qué:** cuando varias unidades comparten predio pero tienen consumo real distinto, cobrar una cuota fija pareja sería injusto para quien consume poco y subsidiaría a quien consume mucho. Medir por medidor individual hace el cobro proporcional y defendible ante el inquilino.

### 3.10 Forma de pago (dato nuevo)
- **Cómo:** campo `forma_pago` en cada Recibo/Pago: `efectivo` o `transferencia` (extensible a tarjeta, depósito, etc. si lo necesitas después).
- **Por qué:** te permite conciliar contra tu cuenta bancaria (solo las transferencias) y llevar control de cuánto manejas en efectivo — útil tanto para tu contabilidad personal como para detectar discrepancias.

---

## 4. Módulos funcionales de la aplicación

| Módulo | Función principal |
|---|---|
| **Dashboard** | Ingreso total del mes, % cobrado, % moroso, próximos vencimientos, rentabilidad global |
| **Propiedades** | Alta/edición del predio: dirección, predial anual, mantenimiento anual, valor comercial total |
| **Unidades** | Espacios rentables dentro de cada propiedad (depa, local, accesoria, bodega...): identificador, tipo, m², atributos específicos, medidor de agua asociado |
| **Contratos** | Vigentes y vencidos por unidad; arrendatario, aval, plazo, renta |
| **Cobranza** | Lista de recibos del mes por unidad, marcar pagado con forma de pago (efectivo/transferencia), generar recibo PDF, historial por inquilino |
| **Agua** | Captura de lectura mensual por medidor, cálculo automático de cargo (cuota fija + m³ consumidos) |
| **Inflación** | Captura mensual del índice (corte día 10), calculadora de renta al renovar por unidad, reporte anual |
| **Reportes** | Rentabilidad por unidad/propiedad/portafolio (filtrable por dirección y arrendador), rentabilidad por m², predial y mantenimiento prorrateados, exportar CSV/Excel |
| **Configuración** | Usuarios, roles, marcas/logos (branding de recibos), tolerancias de pago, parámetros de cálculo |

---

## 5. Arquitectura técnica

```
/app
  /(auth)/login
  /(dashboard)/dashboard
  /(dashboard)/propiedades/[id]
  /(dashboard)/propiedades/[id]/unidades/[unidadId]
  /(dashboard)/contratos/[id]
  /(dashboard)/cobranza
  /(dashboard)/agua              ← lecturas de medidores y cálculo de cargo
  /(dashboard)/reportes
  /(dashboard)/configuracion/marcas   ← logos/branding para recibos
  /api
    /webhooks           ← pagos (Stripe/conekta si automatizas cobro)
    /cron                ← generación de recibos, alertas
/lib
  /calculations          ← funciones puras: inflación, rentabilidad, predial (testeables)
  /db                     ← acceso a datos (Prisma client)
  /auth
/components
  /ui                     ← componentes Tailwind reutilizables
  /forms
/prisma
  schema.prisma
```

**Principio clave de escalabilidad:** toda fórmula de negocio (sección 3) vive en `/lib/calculations` como funciones puras, sin mezclarse con la UI ni con las rutas API. Así puedes testearlas de forma aislada y reutilizarlas en reportes, cron jobs y dashboard sin duplicar lógica.

### Stack recomendado
- **Frontend:** Next.js App Router + React Server Components (menos JS al cliente = carga más rápida) + Tailwind CSS
- **Backend:** API Routes / Server Actions de Next.js (evita mantener un backend separado)
- **Base de datos:** PostgreSQL (relacional — encaja con el modelo Propiedad→Contrato→Recibo) + Prisma ORM (tipado end-to-end con TypeScript)
- **Autenticación:** Neon Auth (Managed Better Auth) con roles (dueño, administrador, solo-lectura). Sustituye a NextAuth.js por decisión autorizada durante la configuración de Neon.
- **Validación:** Zod, tanto en formularios como en API routes
- **Generación de PDFs (recibos):** react-pdf o Puppeteer en un endpoint serverless
- **Cron jobs:** Vercel Cron (o similar) para generación mensual de recibos y alertas
- **Hosting:** Vercel (integración nativa con Next.js, Edge caching)

---

## 6. Seguridad interna (prioridad alta, dado que manejas datos personales de arrendatarios y avales)

1. **Autenticación robusta:** Neon Auth (Managed Better Auth), con sesiones protegidas mediante cookies firmadas y usuarios almacenados en el esquema administrado `neon_auth`. El auto-registro público permanece deshabilitado; las altas son administrativas.
2. **Autorización por rol:** el sistema debe distinguir entre dueño (acceso total) y roles de solo lectura si algún día das acceso a un contador/administrador.
3. **Row Level Security (RLS) en PostgreSQL:** si en el futuro manejas varios propietarios/clientes en la misma base, cada usuario solo debe poder leer sus propias filas a nivel de base de datos, no solo a nivel de aplicación.
4. **Validación server-side siempre:** nunca confiar solo en validación de formulario en el cliente; usar Zod en cada Server Action / API route.
5. **Cifrado de datos sensibles:** datos como identificaciones o RFC de aval/arrendatario, si los guardas, cifrarlos en reposo (columnas cifradas o servicio externo tipo AWS KMS).
6. **HTTPS + variables de entorno:** nunca credenciales en código; usar `.env` + gestor de secretos del hosting.
7. **Rate limiting** en endpoints de login y API pública para evitar fuerza bruta.
8. **Auditoría (audit log):** registrar quién modificó qué contrato/renta y cuándo — importante si más de una persona administra el sistema.
9. **Backups automáticos** de la base de datos (diarios) con retención de al menos 30 días.
10. **Content Security Policy** y headers de seguridad (Next.js `headers()` en `next.config`).

---

## 7. Rendimiento (carga rápida)

- **Server Components por defecto:** solo hidratar como Client Component lo que necesite interactividad (formularios, tablas filtrables).
- **ISR/caching** en reportes que no cambian cada segundo (ej. rentabilidad histórica).
- **Paginación e indexado** en tablas grandes (recibos, contratos vencidos) — nunca cargar todo el historial de golpe.
- **Índices de base de datos** en columnas de búsqueda frecuente: `propiedad_id`, `contrato_id`, `periodo`.
- **Imágenes optimizadas** con `next/image` si subes fotos de las propiedades.
- **Edge functions** para lecturas de dashboard si el tráfico lo justifica.

---

## 8. Roadmap sugerido por fases

| Fase | Entregable |
|---|---|
| **1. Fundación** | Auth, modelo de datos, CRUD de Propiedades, Unidades y Contratos |
| **2. Cobranza core** | Generación automática de recibos, marcar pagos con forma de pago, dashboard de cobranza |
| **3. Inflación y renovación** | Captura de índice mensual (corte día 10), calculadora de renta nueva, alertas de vencimiento, reporte anual de inflación |
| **4. Rentabilidad y reportes** | Cálculos de predial y mantenimiento prorrateados, rentabilidad mensual/anual/por m², reportes filtrables por dirección y arrendador, exportables |
| **5. Agua y branding** | Módulo de medidores/lecturas y cálculo de cargo, configuración de marcas/logos para recibos |
| **6. Refinamiento** | PDFs de recibos con branding, notificaciones (email/WhatsApp), auditoría, hardening de seguridad |

---

## 9. Notas finales

- El punto más importante para que esto funcione como "automatización" real (no solo captura de datos) es el **cron mensual** que genera recibos y calcula estatus de cobranza sin que tú tengas que entrar a hacerlo manualmente.
- Te recomiendo empezar el proyecto con la Fase 1 y 2 primero — son las que dan valor inmediato (dejar de perseguir pagos manualmente) — y dejar rentabilidad/inflación para cuando el flujo de cobranza ya esté estable.
