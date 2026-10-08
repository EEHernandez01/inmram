# Plan de cambios: Inicio más intuitivo

## Objetivo

Hacer que Inicio ayude a identificar y atender lo urgente, conserve una navegación clara en móvil y presente cifras sin ambigüedad. Se mantienen los flujos actuales de cobranza, permisos y contratos; Inicio los enlaza en vez de duplicar operaciones sensibles.

## Decisiones de alcance

- La acción principal de Inicio llevará a Cobranza. La generación de recibos seguirá en su pantalla actual y respetará los permisos existentes.
- La navegación móvil reutilizará los mismos destinos y filtros por rol de la barra lateral.
- El indicador de renovaciones representará el total real dentro de los próximos 90 días; la lista podrá seguir mostrando solo los cinco vencimientos más cercanos.
- El estado vacío distinguirá entre un periodo sin recibos y un periodo con cobranza al corriente, sin inferir por qué faltan recibos.
- Los cambios visuales respetarán los tokens y estilos actuales del producto.

## Lista de tareas

### Fase 1: Navegación y orientación

- [ ] **Tarea 1: Agregar navegación administrativa para móvil.** Incorporar un menú accesible que reutilice los grupos, rutas, roles y estado activo existentes. Incluir acceso a perfil y salida de sesión en un lugar secundario.
- [ ] **Tarea 2: Dar prioridad a la acción operativa en Inicio.** Bajar el protagonismo de cerrar sesión y destacar el acceso a Cobranza, conservando el resumen mensual y su enlace.

### Punto de revisión: navegación

- [ ] En móvil se puede entrar a Inicio, Cobranza, Propiedades, Contratos y módulos permitidos por el rol.
- [ ] El menú puede abrirse y cerrarse con teclado; el foco y el estado abierto son perceptibles.
- [ ] En escritorio se conserva la navegación lateral y no aparecen dos acciones principales competidoras.

### Fase 2: Claridad de datos y prioridades

- [ ] **Tarea 3: Corregir el total de renovaciones.** Obtener el total de contratos por vencer por separado de la lista limitada; rotular la lista como los próximos cinco cuando aplique.
- [ ] **Tarea 4: Mejorar la tarjeta de pagos pendientes.** Agrupar pagos vencidos y por vencer, mantener vencidos primero y mostrar días de atraso junto con el saldo cuando corresponda.
- [ ] **Tarea 5: Aclarar los estados sin pendientes y sin recibos.** Mostrar un mensaje de cobranza al corriente cuando existan recibos y no haya saldo; cuando no existan recibos del periodo, orientar al usuario a revisar Cobranza.

### Punto de revisión: información

- [ ] La cifra de renovaciones no se limita accidentalmente a cinco.
- [ ] Cada pago comunica si está vencido o próximo a vencer, su fecha relevante y su saldo.
- [ ] Los estados vacíos no confunden “todo pagado” con “no hay recibos”.
- [ ] Los enlaces conservan el periodo y el estatus correctos al abrir Cobranza.

### Fase 3: Acabado visual y accesibilidad

- [ ] **Tarea 6: Mejorar lectura y separación visual.** Ajustar contraste entre tarjetas, jerarquía de títulos y etiquetas, y densidad vertical para facilitar el escaneo sin cambiar la identidad visual.
- [ ] **Tarea 7: Revisar la experiencia adaptable.** Ajustar el orden y ancho de bloques para móvil, tableta y escritorio; confirmar focos visibles, etiquetas accesibles y que el color no sea el único indicador de urgencia.

### Punto de revisión: cierre

- [ ] Revisar Inicio en anchos móvil, tableta y escritorio.
- [ ] Recorrer navegación y enlaces con teclado.
- [ ] Confirmar estados con datos: cobranza con pendientes, vencidos, todo pagado, sin recibos; renovaciones con más de cinco resultados.

## Dependencias y archivos probables

| Tarea | Dependencias | Archivos probables |
| --- | --- | --- |
| 1. Navegación móvil | Ninguna | `src/components/dashboard/sidebar.tsx`, `src/components/dashboard/admin-shell.tsx`, posiblemente un componente nuevo en `src/components/dashboard/` |
| 2. Acción principal | Tarea 1 para resolver ubicación de salida de sesión | `src/app/(admin)/dashboard/page.tsx`, componentes de navegación/perfil |
| 3. Total de renovaciones | Ninguna | `src/lib/services/dashboard.ts`, `src/app/(admin)/dashboard/page.tsx` |
| 4. Prioridad de pagos | Ninguna | `src/app/(admin)/dashboard/page.tsx`, posiblemente `src/lib/calculations/collection.ts` si se extrae formato de atraso |
| 5. Estados vacíos | Ninguna | `src/app/(admin)/dashboard/page.tsx` |
| 6. Jerarquía visual | Tareas 1–5 | `src/app/(admin)/dashboard/page.tsx`, `src/app/globals.css` solo si hace falta un token compartido |
| 7. Revisión adaptable | Tareas 1–6 | Archivos de Inicio y navegación que hayan cambiado |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Duplicar o exponer acciones restringidas al mover controles | Alto | Dejar generación de cobranza en su página actual y reutilizar la política de roles para navegación y acciones. |
| Presentar como total una lista limitada a cinco contratos | Medio | Separar explícitamente el conteo del listado limitado. |
| El menú móvil pierde accesibilidad o tapa contenido | Medio | Usar controles semánticos, foco visible, cierre con Escape y revisar los anchos pequeños. |
| Cambios de presentación alteran filtros al navegar a Cobranza | Medio | Mantener `periodo` y `estatus` en los enlaces existentes y verificar ambos destinos. |

## Fuera de alcance

- Rediseñar los módulos de Cobranza, Propiedades o Contratos.
- Cambiar reglas de negocio, permisos, cálculo de rentabilidad o generación de recibos.
- Añadir un selector de periodos al dashboard; el resumen seguirá mostrando el periodo actual.

## Orden recomendado

Tarea 1 → Tarea 2 → Tareas 3–5 → Tarea 6 → Tarea 7. Revisar cada punto de control antes de continuar a la siguiente fase.
