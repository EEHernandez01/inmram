# Plan progresivo de refactorización

## Objetivo

Mejorar la resiliencia, mantenibilidad, consistencia visual y escalabilidad de Cobranza Rentas sin reescribir la aplicación ni cambiar su identidad, stack o comportamiento funcional innecesariamente.

## Principios de trabajo

- Aplicar cambios pequeños y verificables.
- Conservar Next.js, React, TypeScript, Prisma, Neon, Zod y Tailwind existentes.
- Priorizar componentes de servidor y aislar la interacción en componentes cliente pequeños.
- No incorporar dependencias sin una necesidad demostrable.
- Medir antes de optimizar consultas o rendimiento.
- Ejecutar lint, pruebas y build al finalizar cada fase.

## Estado de partida

- Lint: correcto.
- Pruebas: 11 de 11 correctas.
- Build de producción: compila correctamente.
- Sin vulnerabilidades críticas confirmadas en la revisión estática.
- Existen advertencias de módulos ESM y oportunidades de mejora en errores globales, consistencia UI, cobertura de pruebas y escalabilidad de listados.

## Fase 1 — Resiliencia y estados de error

**Estado: en curso.** Se completaron los boundaries de error y las vistas 404; queda normalizar el feedback de formularios.

### Alcance

- Agregar `error.tsx` para el área administrativa y, si procede, uno global.
- Agregar `not-found.tsx` con navegación clara para recursos inexistentes.
- Definir un patrón uniforme de mensajes de éxito y error tras formularios.
- Verificar que los errores expuestos al usuario no filtren información técnica.

### Avance realizado

- Creado `src/app/(admin)/error.tsx`, con recuperación mediante reintento y regreso al panel.
- Creado `src/app/(admin)/not-found.tsx`, para recursos administrativos inexistentes.
- Creado `src/app/not-found.tsx`, para rutas públicas no encontradas.

### Archivos involucrados

- `src/app/(admin)/error.tsx` (nuevo)
- `src/app/(admin)/not-found.tsx` (nuevo)
- `src/app/global-error.tsx` (solo si hace falta)
- `src/components/ui/alert.tsx`
- Páginas administrativas que usan parámetros `error`, `success` o equivalentes.

### Riesgo e impacto

- Riesgo: bajo.
- Impacto: alto en UX y soporte.

### Criterio de finalización

- Los errores inesperados muestran una interfaz clara con reintento o regreso.
- Un registro inexistente ofrece un estado 404 consistente.
- Los flujos principales comunican éxito y error de manera uniforme.

## Fase 2 — Calidad, pruebas y configuración

**Estado: parcialmente completada.** La configuración ESM y las pruebas unitarias de validación están listas; la cobertura de autorización y de flujos que requieren base de datos queda pendiente de una infraestructura de pruebas aislada.

### Alcance

- Revisar la advertencia de ESM y declarar `"type": "module"` solo si scripts y herramientas siguen siendo compatibles.
- Añadir pruebas para autorización, validaciones de servicios y flujos de recibos.
- Establecer una lista mínima de escenarios de regresión por módulo.

### Avance realizado

- Declarado el paquete como ESM para eliminar la advertencia de Node durante pruebas y build.
- Agregadas pruebas de validación de medidores, lecturas y filtros de reportes.
- La suite actual contiene 15 pruebas unitarias correctas.
- ESLint dirigido a las pruebas nuevas: sin errores; `package.json` no está cubierto por su configuración, por lo que solo informa una advertencia de archivo ignorado.
- La ejecución integral de `npm run lint` y `npm run build` excedió el límite de tiempo del entorno sin producir un error de compilación; debe repetirse en CI o un entorno sin ese límite.

### Archivos involucrados

- `package.json`
- `tests/collection.test.ts`
- Nuevos archivos de prueba en `tests/`
- Servicios y validaciones de `src/lib/`.

### Riesgo e impacto

- Riesgo: bajo.
- Impacto: alto en confiabilidad.

### Criterio de finalización

- Sin advertencias ESM evitables.
- Cobertura de los permisos de lectura/escritura y operaciones sensibles.
- Lint, pruebas y build correctos.

## Fase 3 — Consistencia del sistema visual

**Estado: en curso.**

### Alcance

- Consolidar el uso de `Field`, `Input`, `Select` y `Textarea`.
- Normalizar botones primarios, secundarios y destructivos.
- Reducir repetición de tarjetas y bloques de métricas.
- Incorporar foco visible, mensajes de ayuda y error asociados a cada campo.

### Avance realizado

- Creado el componente `Button` con variantes primaria, secundaria y destructiva.
- Sustituidos los botones primarios repetidos en formularios de propiedades, unidades, perfil, usuarios y acciones de fundación.
- Lint dirigido y 15 pruebas unitarias correctas después del cambio.

### Archivos involucrados

- `src/components/ui/form-controls.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/page-header.tsx`
- Formularios y páginas de cobranza, propiedades, contratos, agua e inflación.

### Riesgo e impacto

- Riesgo: bajo.
- Impacto: alto en consistencia y accesibilidad.

### Criterio de finalización

- Controles equivalentes comparten altura, foco, espaciado y semántica.
- Las acciones expresan claramente su jerarquía visual.
- No se introducen abstracciones con props innecesarias.

## Fase 4 — Refactorización localizada de módulos complejos

**Estado: en curso.**

### Alcance

- Separar responsabilidades de la pantalla de cobranza.
- Extraer componentes de dominio pequeños: resumen, filtros, tabla, tarjeta móvil, pago y acciones del recibo.
- Revisar `location-picker` y extraer partes solo si mejoran lectura y pruebas.

### Avance realizado

- Separada la interfaz de cobranza en componentes de estado, acciones, tarjeta móvil y tabla de escritorio.
- La página conserva la carga de datos y los filtros como Server Component.
- Lint dirigido, TypeScript sin emisión y 15 pruebas unitarias correctas.

### Archivos involucrados

- `src/app/(admin)/cobranza/page.tsx`
- Nuevos componentes en `src/components/collection/` si la estructura resultante lo justifica.
- `src/components/forms/location-picker.tsx`.

### Riesgo e impacto

- Riesgo: medio.
- Impacto: alto en mantenibilidad.

### Criterio de finalización

- La página de cobranza conserva el comportamiento actual con componentes de responsabilidad clara.
- Las piezas extraídas tienen tipos explícitos y pruebas donde corresponda.

## Fase 5 — Datos y escalabilidad

### Alcance

- Medir consultas de listados antes de optimizarlas.
- Agregar paginación y filtros en servidor donde el volumen lo requiera.
- Reducir relaciones o columnas cargadas cuando la UI no las use.
- Verificar índices según los filtros reales de producción.

### Archivos involucrados

- `src/lib/services/foundation.ts`
- `src/lib/services/collection.ts`
- `src/lib/services/reports.ts`
- Validaciones relacionadas en `src/lib/validation/`.
- `prisma/schema.prisma` y migraciones, solo si la medición justifica nuevos índices.

### Riesgo e impacto

- Riesgo: medio.
- Impacto: medio/alto al aumentar la cartera.

### Criterio de finalización

- Los listados grandes no cargan registros innecesarios.
- Los filtros y páginas mantienen URL compartible y comportamiento estable.
- Cualquier cambio de esquema está documentado y migrado de forma segura.

## Fase 6 — Rendimiento y recursos visuales

### Alcance

- Revisar imágenes de propiedades y decidir cuáles deben usar `next/image`.
- Mantener `img` solo en previews locales o casos donde sea técnicamente necesario.
- Verificar tamaños, carga diferida y configuración de orígenes remotos.

### Archivos involucrados

- `src/components/maps/property-gallery.tsx`
- `src/components/forms/property-photo-input.tsx`
- `src/app/(admin)/propiedades/page.tsx`
- `next.config.ts`.

### Riesgo e impacto

- Riesgo: medio.
- Impacto: medio.

### Criterio de finalización

- Las imágenes remotas tienen tamaño definido y carga adaptativa.
- Los previews de archivos locales siguen funcionando.

## Fase 7 — Pulido de accesibilidad y responsive

### Alcance

- Revisar flujos en móvil, tablet y escritorio.
- Validar navegación por teclado, foco, contraste y etiquetas de formulario.
- Agregar `rel="noreferrer"` a enlaces externos con `target="_blank"` cuando aplique.
- Refinar tablas, tarjetas y modales según el contenido de cada módulo.

### Riesgo e impacto

- Riesgo: bajo.
- Impacto: medio.

### Criterio de finalización

- Los flujos esenciales funcionan en anchos pequeños sin overflow perjudicial.
- Los controles son operables con teclado y tienen etiquetas comprensibles.

## Orden de implementación

1. Fase 1: resiliencia y estados de error.
2. Fase 2: pruebas y configuración.
3. Fase 3: consistencia UI.
4. Fase 4: cobranza y componentes complejos.
5. Fase 5: datos y escalabilidad, guiados por medición.
6. Fase 6: imágenes y carga de recursos.
7. Fase 7: pulido responsive y accesibilidad.

## Verificación obligatoria por fase

```bash
npm run lint
npm test
npm run build
```

Además de los controles automatizados, validar manualmente el flujo afectado con los roles de solo lectura y escritura, y revisar escritorio y móvil cuando haya cambios de interfaz.
