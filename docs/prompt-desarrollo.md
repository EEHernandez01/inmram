# Prompt maestro — Desarrollo del Sistema de Cobranza de Rentas

Este archivo es la referencia fija para arrancar (o retomar) el desarrollo del proyecto con un asistente de código (Claude Code, o esta misma conversación). Cópialo y pégalo como primer mensaje cada vez que empieces una sesión de desarrollo nueva, para que el asistente tenga todo el contexto sin que tengas que explicarlo de nuevo.

---

## PROMPT (copiar desde aquí)

Vamos a desarrollar un sistema web de control y automatización de cobranza de rentas, con stack **Next.js + React + TypeScript + Tailwind CSS**. Ya tengo el proyecto planeado en 4 documentos de referencia, que debes leer completos antes de escribir cualquier código:

1. **`plan-desarrollo-cobranza-rentas.md`** — Backend: modelo de datos completo (Propietario → Propiedad → Unidad → Contrato → Recibo/AjusteInflación/Medidor de agua), todas las fórmulas de cálculo (inflación acumulada, renta de renovación, predial y mantenimiento prorrateados, rentabilidad mensual/anual/por m², cargo de agua por medidor, morosidad), arquitectura técnica recomendada, lineamientos de seguridad, consideraciones de rendimiento y roadmap por fases.

2. **`plan-diseño-frontend.md`** — Historial de exploración de diseño: por qué se descartaron ciertas direcciones visuales y por qué se eligió la dirección "Banca privada". Úsalo solo como contexto de decisión, no como fuente de tokens (esos están en el archivo 4).

3. **`DESIGN-SYSTEM.md`** — Sistema de diseño definitivo: paleta de color con su significado funcional (verde/ámbar/rojo son exclusivos para estatus de pago, nunca decorativos), tipografía, y ejemplos de código ya escritos para cada componente base (badge de estatus, botón primario, tarjeta KPI, ítem de navegación, tabla de datos).

4. **`tailwind.config.ts`** — Los tokens del punto 3 ya convertidos en configuración de Tailwind, listos para copiar a la raíz del proyecto.

### Cómo quiero que trabajes con estos 4 archivos

- **El modelo de datos del archivo 1 es la fuente de verdad.** No cambies nombres de entidades, relaciones ni fórmulas sin decírmelo explícitamente y explicarme por qué. Si algo no está claro o falta un caso, pregúntame antes de asumir.
- **El archivo 4 (`tailwind.config.ts`) se usa tal cual**, no generes colores nuevos ni "de relleno" (placeholders) fuera de esa paleta. Si necesitas un color que no está definido, dime y lo agregamos juntos al sistema de diseño, no lo inventes sobre la marcha.
- **El archivo 3 (`DESIGN-SYSTEM.md`) define los componentes base.** Antes de escribir un botón, badge, tarjeta o tabla desde cero, revisa si ya hay un patrón definido ahí y reutilízalo. Si construyes un componente nuevo que no está documentado, avísame para que lo agreguemos al sistema de diseño y quede consistente para el resto del proyecto.
- **Los colores de estatus (verde/ámbar/rojo) son funcionales, no decorativos** — solo se usan para pagado/pendiente/vencido y para alertas de vencimiento de contrato. No los reutilices para otra cosa.
- **Sigue el roadmap por fases del archivo 1** salvo que te diga lo contrario: primero fundación (auth + modelo de datos + CRUD de Propiedades/Unidades/Contratos), luego cobranza core, después inflación/renovación, luego rentabilidad/reportes, y al final agua/branding y refinamiento. No saltes a construir reportes avanzados si todavía no existe el CRUD base.
- **Aplica los lineamientos de seguridad del archivo 1 desde el inicio**, no como algo que se agrega después: validación server-side con Zod, autenticación con Neon Auth (Managed Better Auth; sustitución de NextAuth autorizada durante la configuración de Neon), nunca credenciales hardcodeadas, y cuidado especial con los datos personales de arrendatarios y avales.
- **El PDF de recibo usa un tema aparte**, más simple y siempre en modo claro, según la excepción que se explica en `DESIGN-SYSTEM.md` — no le apliques el mismo layout del dashboard.
- **Cuando algo no esté cubierto por ninguno de los 4 archivos** (un caso de negocio nuevo, una pantalla no descrita, un dato adicional), dime que no está documentado y pregúntame cómo proceder, en lugar de decidir por tu cuenta y que quede inconsistente con el resto del proyecto.
- Al terminar una fase o un módulo importante, dame un resumen breve de qué se construyó y qué falta, para que pueda dar seguimiento sin tener que leer todo el código.

Empecemos por: [aquí escribes en qué quieres trabajar hoy — ej. "el schema de Prisma completo del archivo 1" o "el layout base del dashboard con el sidebar y las tarjetas KPI"].

## FIN DEL PROMPT

---

## Notas de uso (no forma parte del prompt)

- Guarda los 4 archivos referenciados en la raíz de tu repositorio (o en una carpeta `/docs`) para que estén siempre accesibles junto con este prompt.
- Si algún archivo cambia (por ejemplo, agregas un nuevo cálculo al backend o ajustas un color del sistema de diseño), no necesitas reescribir este prompt — solo actualiza el archivo correspondiente; el prompt ya le indica al asistente que esos archivos son la fuente de verdad vigente.
- Si en el futuro agregas un quinto documento de referencia (por ejemplo, un plan de pruebas o de despliegue), solo añade una entrada más a la lista numerada de este prompt.
