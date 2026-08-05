# Sistema de Diseño — Dirección A "Banca privada"

Sistema de Control y Automatización de Cobranza de Rentas · Next.js + React + TypeScript + Tailwind

Este documento acompaña a `tailwind.config.ts`. Úsalo como referencia al construir cualquier componente nuevo, para que el proyecto mantenga consistencia visual sin importar quién escriba el código (tú, otro desarrollador, o yo en otra sesión).

---

## 1. Principio general

La interfaz maneja dinero y datos personales de tus inquilinos. Cada decisión visual prioriza **legibilidad y confianza** sobre decoración. Si una alternativa de diseño se ve "más bonita" pero es menos clara para leer un monto o un estatus de pago, se descarta.

---

## 2. Paleta de color

| Token Tailwind | Hex | Uso |
|---|---|---|
| `bg-bg` | `#FAFAF9` | Fondo general de la app |
| `bg-surface` | `#FFFFFF` | Tarjetas, tablas, sidebar |
| `border-border` | `#E7E5E4` | Bordes sutiles entre secciones |
| `text-ink` | `#1C1917` | Texto principal |
| `text-ink-secondary` | `#78716C` | Texto secundario, etiquetas, metadatos |
| `bg-brand` / `text-brand` | `#1E3A5F` | Color de marca — botones primarios, enlaces activos, ítem de nav activo |
| `bg-brand-hover` | `#17304D` | Estado hover de elementos de marca |
| `bg-brand-soft` | `#E8EEF4` | Fondo suave para resaltar el ítem de navegación activo |

### Colores funcionales (estatus) — no decorativos

Estos colores **comunican información**, no son elección estética. Se usan exclusivamente para estatus de cobranza y contratos, nunca para otra cosa (para no diluir su significado):

| Token | Hex | Significado | Dónde se usa |
|---|---|---|---|
| `success` / `success-soft` | `#166534` / `#E7F5EC` | Pagado, al corriente | Badge de estatus, íconos de confirmación |
| `warning` / `warning-soft` | `#B45309` / `#FDF3E4` | Pendiente, próximo a vencer | Badge de estatus, alertas de contrato por vencer |
| `danger` / `danger-soft` | `#B91C1C` / `#FBEAEA` | Vencido, moroso | Badge de estatus, alertas críticas |

**Regla:** nunca reutilices verde/ámbar/rojo para botones o elementos decorativos normales — el usuario debe poder confiar en que "si es rojo, algo requiere su atención" en cualquier parte del sistema.

---

## 3. Tipografía

- **`font-serif`** (Source Serif 4): reservada para títulos de página (`<h1>` de cada sección) y el nombre de marca en el sidebar. Da el toque de seriedad/"banca privada" sin usarse en exceso.
- **`font-sans`** (Inter): todo lo demás — cuerpo de texto, tablas, formularios, botones, navegación.
- **Montos y cifras:** siempre usar `tabular-nums` para que las columnas de dinero se alineen verticalmente como un estado de cuenta.

  ```tsx
  <span className="font-sans font-bold [font-variant-numeric:tabular-nums]">
    $8,500
  </span>
  ```

### Escala tipográfica sugerida

| Elemento | Clase Tailwind aproximada |
|---|---|
| Título de página (`h1`) | `font-serif text-2xl font-semibold` |
| Título de sección (`h2`) | `font-sans text-sm font-semibold` |
| Cuerpo / tabla | `font-sans text-sm` |
| Etiquetas / metadatos | `font-sans text-xs text-ink-secondary` |
| Valor de KPI grande | `font-sans text-2xl font-bold tracking-tight` |

---

## 4. Componentes base y sus reglas

### Badge de estatus
```tsx
// Pagado
<span className="inline-flex items-center gap-1.5 rounded-pill bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
  Pagado
</span>

// Pendiente
<span className="inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
  Pendiente
</span>

// Vencido
<span className="inline-flex items-center gap-1.5 rounded-pill bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
  Vencido
</span>
```

### Botón primario
```tsx
<button className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
  Registrar pago
</button>
```

### Tarjeta KPI
```tsx
<div className="rounded-card border border-border bg-surface p-5">
  <p className="text-xs font-medium text-ink-secondary">Ingreso cobrado este mes</p>
  <p className="mt-2 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">
    $84,500
  </p>
</div>
```

### Ítem de navegación (sidebar)
```tsx
// Activo
<div className="flex items-center gap-3 rounded bg-brand-soft px-3 py-2.5 text-sm font-medium text-brand">
  Dashboard
</div>

// Inactivo
<div className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-bg hover:text-ink">
  Propiedades
</div>
```

### Tabla de datos
- Encabezados: `text-xs uppercase tracking-wide text-ink-secondary font-semibold`, borde inferior `border-border`.
- Filas: hover sutil (`hover:bg-bg/50`), sin zebra-striping (compite visualmente con los badges de estatus).
- Montos: siempre alineados con `tabular-nums` y peso `font-semibold`.

---

## 5. Layout

- **Sidebar fijo:** 240px de ancho en escritorio, oculto detrás de un menú hamburguesa en mobile (`< 900px`).
- **Contenido principal:** máximo `1200px` de ancho, con padding generoso (`px-9 py-7` aprox.) para que la densidad de datos no se sienta apretada.
- **Tarjetas y secciones:** `rounded-card` (10px), borde `border-border`, sin sombras pronunciadas — el look es plano e intencional, no "flotante".

---

## 6. Excepción importante: el recibo PDF

El tema del dashboard (incluye colores de marca y estatus) es **solo para el panel de administración**. El PDF del recibo que reciben tus inquilinos:
- Debe ser siempre claro (fondo blanco), nunca oscuro, para que se lea bien impreso o en cualquier dispositivo.
- Usa el logo real de tu marca en vez del monograma placeholder.
- Puede tomar el color `brand` (#1E3A5F) como acento, pero mantiene tipografía y layout más simples, pensados para imprimirse.

---

## 7. Cómo instalar en tu proyecto Next.js

1. Copia `tailwind.config.ts` a la raíz de tu proyecto (sustituye el que genera `create-next-app`).
2. Agrega las fuentes en `app/layout.tsx`:

   ```tsx
   import { Inter, Source_Serif_4 } from "next/font/google";

   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
   const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: "600", variable: "--font-source-serif" });
   ```

3. Usa las clases de este documento (`bg-brand`, `text-success`, `rounded-card`, etc.) directamente en tus componentes — ya están disponibles como utilidades de Tailwind gracias al `theme.extend` del config.
