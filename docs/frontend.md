# Exploración de Diseño Frontend — Sistema de Cobranza de Rentas

Este documento es para decidir **dirección visual**, no para implementar todavía. La idea es que compares las propuestas y me digas cuál resuena, qué combinas de cada una, o qué ajustar.

---

## 1. Punto de partida: qué tipo de producto es esto

Antes de hablar de colores, vale la pena nombrar qué es esta interfaz, porque eso determina qué buen diseño significa aquí:

- Es una **herramienta de trabajo diaria**, no un sitio de marketing. La usarás tú (o alguien de confianza) para revisar cobranza, no para impresionar visitantes.
- Maneja **dinero y datos personales** — la sensación visual debe transmitir seriedad y control, no "app bonita" vacía.
- Es **densa en datos**: tablas de recibos, estatus de pago, montos, fechas de vencimiento. El diseño tiene que priorizar legibilidad y escaneo rápido sobre decoración.
- Se va a usar tanto en escritorio (revisión mensual completa) como en **celular** (checar rápido si alguien pagó, desde donde sea).
- Tiene un componente de **marca**: los recibos que ven tus inquilinos deben verse profesionales y llevar tu logo/identidad (Inmobiliaria Ramos / Rochester).

Con eso en mente, evité las 3 estéticas que cualquier IA genera por default (crema con acento terracota; negro con acento neón; estilo periódico con líneas finas) salvo que alguna te haga sentido — aquí te propongo 3 direcciones pensadas específicamente para un dashboard financiero/inmobiliario.

---

## 2. Un principio no-negociable: color con significado

Independientemente de la dirección que elijas, hay un sistema que debe existir sí o sí porque es información, no decoración:

| Estatus | Color funcional |
|---|---|
| Pagado | Verde (éxito) |
| Pendiente (dentro de plazo) | Ámbar/neutro |
| Vencido / moroso | Rojo (alerta) |
| Próximo a vencer contrato | Naranja (advertencia) |

Esto se mantiene igual sin importar la paleta general del producto — es el lenguaje visual de "¿me deben o no?", y tiene que leerse en medio segundo en una tabla de 20 filas.

---

## 3. Tres direcciones de diseño

### Dirección A — "Banca privada" (seria, minimalista, confianza)

- **Paleta:** fondo `#FAFAF9` (blanco cálido, no blanco puro), texto principal `#1C1917`, azul marino profundo `#1E3A5F` como color de marca/acento, verde `#166534` y rojo `#B91C1C` para estatus, gris `#78716C` para texto secundario.
- **Tipografía:** una sans-serif geométrica y sobria para todo (ej. Inter o similar) — números tabulares alineados (`font-variant-numeric: tabular-nums`) para que las columnas de montos se lean como en un estado de cuenta bancario.
- **Layout:** sidebar fijo a la izquierda con navegación (Dashboard, Propiedades, Cobranza, Reportes), contenido en tarjetas planas con bordes sutiles (sin sombras exageradas), tablas densas con líneas horizontales finas.
- **Sensación:** como el portal de un banco o una fintech seria. Cero personalidad "juguetona" — todo comunica precisión y control.
- **Mejor si:** quieres que el sistema se sienta como una herramienta financiera profesional, y no te importa que sea "sobrio" con tal de que inspire confianza y sea rápido de leer.

```
┌──────────┬─────────────────────────────────┐
│          │  Dashboard          [+ Nuevo]    │
│ Sidebar  │  ┌────────┐ ┌────────┐ ┌───────┐ │
│  · Dash  │  │ $XX,XXX│ │ 92% ✓  │ │ 3 venc│ │
│  · Prop. │  └────────┘ └────────┘ └───────┘ │
│  · Cobr. │  ─────────────────────────────── │
│  · Rep.  │  Tabla de recibos del mes...      │
└──────────┴─────────────────────────────────┘
```

---

### Dirección B — "Cálida y personal" (boutique, cercana, humana)

- **Paleta:** fondo blanco cálido `#FFFDF9`, terracota apagado `#B5654A` como acento (más rojizo-ladrillo que naranja), verde salvia `#5F7A5C` para éxito, texto `#2B2622`, detalles en dorado envejecido `#A88A56` para elementos de marca.
- **Tipografía:** un serif con carácter para títulos (transmite algo "hecho a mano", propio de un negocio familiar de propiedades) combinado con una sans-serif limpia para datos y tablas.
- **Layout:** menos "software corporativo", más cálido: tarjetas con esquinas suavemente redondeadas, íconos discretos junto a cada propiedad (más visual, casi como fichas de un catálogo), buen espacio en blanco.
- **Sensación:** transmite que detrás del sistema hay una persona/familia administrando propiedades con cuidado, no una corporación anónima. Encaja bien si tu marca (Inmobiliaria Ramos) tiene ese tono cercano.
- **Mejor si:** te importa que el sistema —y sobre todo los recibos que ven tus inquilinos— se sientan personales y cálidos, no como un ERP genérico.

```
┌──────────┬─────────────────────────────────┐
│ (logo)   │  Buenas tardes 👋                │
│ Sidebar  │  ┌──────────────┐ ┌────────────┐ │
│ redondo  │  │ Depa 101     │ │ Local A    │ │
│          │  │ ● Pagado     │ │ ● Vencido  │ │
│          │  └──────────────┘ └────────────┘ │
└──────────┴─────────────────────────────────┘
```

---

### Dirección C — "Panel de control" (denso, tipo analytics/trading)

- **Paleta:** fondo gris muy oscuro `#14161A`, superficies `#1D2025`, texto `#E8E9EA`, acento cian/azul eléctrico `#3B82F6` para elementos interactivos, verde `#22C55E` y rojo `#EF4444` de alto contraste para estatus (se leen aún mejor en modo oscuro).
- **Tipografía:** sans-serif técnica (ej. una familia tipo Inter/IBM Plex) con jerarquía marcada por peso, no por tamaño exagerado — mucha información en poco espacio.
- **Layout:** modo oscuro por defecto, muchos widgets pequeños de datos en el dashboard (ingreso del mes, morosidad, próximos vencimientos, rentabilidad) tipo panel de control financiero, gráficas de barras/línea integradas.
- **Sensación:** como Stripe Dashboard o una terminal de trading — se siente "power user", ideal si vas a pasar tiempo revisando números y quieres que resalten sobre un fondo que no cansa la vista en sesiones largas.
- **Mejor si:** revisas el sistema seguido y de noche, te gusta ver mucha data de un vistazo, y no te preocupa que los recibos para inquilinos usen una plantilla distinta y más clara (el modo oscuro es para tu panel de administración, no para el PDF del recibo).

```
┌──────────┬─────────────────────────────────┐
│ ▓ dark   │  ┌────┐┌────┐┌────┐┌────┐        │
│ sidebar  │  │$   ││%   ││⚠3  ││📈  │        │
│          │  └────┘└────┘└────┘└────┘        │
│          │  ▁▃▅▇▅▃▁ gráfica de cobranza      │
└──────────┴─────────────────────────────────┘
```

---

## 4. Comparación rápida

| | A. Banca privada | B. Cálida y personal | C. Panel de control |
|---|---|---|---|
| Sensación | Seria, confiable | Cercana, humana | Técnica, "power user" |
| Modo | Claro | Claro | Oscuro |
| Mejor para | Uso profesional/formal | Marca con tono familiar | Revisión frecuente de datos |
| Riesgo | Puede sentirse frío | Puede restar "seriedad" en temas de dinero | Puede intimidar si no revisas seguido |
| Recibos a inquilinos | Encajan directo con este estilo | Encajan directo con este estilo | Necesitarían plantilla aparte (clara) |

---

## 5. Independiente de la dirección elegida

Estos elementos del sistema de diseño hay que definirlos sí o sí, y son reutilizables sin importar cuál dirección elijas:

- **Componentes base:** badges de estatus, tabla de datos con ordenamiento, tarjetas de resumen (KPI cards), formularios de captura (contrato, propiedad, unidad), modal de confirmación de pago.
- **Accesibilidad:** contraste suficiente en textos de montos y estatus (crítico, ya que son los datos más importantes de la página), foco de teclado visible, tamaños de texto legibles en tablas densas.
- **Mobile-first en las pantallas de consulta rápida:** "¿quién me debe hoy?" y "marcar como pagado" deben funcionar perfecto desde el celular, aunque la captura de contratos completos sea más cómoda en escritorio.
- **Plantilla de recibo PDF separada del tema del dashboard:** el recibo que ve el inquilino no tiene que compartir el modo oscuro (si eliges C) — debe ser siempre clara, imprimible y con tu logo.

---

## 6. Próximo paso

Dime cuál dirección te late más (A, B, C, o una mezcla — por ejemplo "estructura de A pero con la calidez de B"), y con eso preparo:
1. Un mockup visual real (HTML/React) del dashboard principal para que lo veas renderizado, no solo descrito.
2. La paleta y tipografía definitivas como tokens de diseño (variables CSS/Tailwind config) para que el desarrollo sea consistente desde el primer componente.
