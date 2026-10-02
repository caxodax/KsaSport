# 🎨 Auditoría Crítica de UI/UX con Impeccable: KsaSport
**Metodología:** Framework Impeccable (Craft Floor, Anti-pattern Detector, Audit Heuristics)  
**Fecha:** Octubre 2026 | **Meta:** Salida a Producción en 48 Horas  
**Archivos Escaneados:** 100 archivos en `src/` | **Hallazgos Detectados:** 30 antipatrones + 29 alertas de accesibilidad y estructura

---

## 🏆 Resumen Ejecutivo: Scorecard de Salud UI/UX

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 IMPECCABLE HEALTH SCORE: 9 / 20 (POOR)                      │
│     "La interfaz tiene alma deportiva y buenas intenciones móviles, pero    │
│      delata patrones genéricos de IA, contrastes ilegibles bajo luz solar   │
│      y botones mudos sin accesibilidad que deben corregirse para producción" │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Accesibilidad (A11y)         : 1 / 4  (Fallas graves de contraste y ARIA) │
│ 2. Rendimiento Visual           : 2 / 4  (92 <img> sin optimizar, bundle pes.)│
│ 3. Sistema de Diseño & Theming  : 2 / 4  (Tokens mezclados con colores sueltos)│
│ 4. Adaptabilidad Responsive     : 2 / 4  (Buenos drawers, pero tablas rígidas)│
│ 5. Integridad de Implementación : 2 / 4  (30 antipatrones y tells de IA)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 SECCIÓN 1: Los 30 Antipatrones Detectados por Impeccable

El detector determinista de Impeccable identificó patrones que arruinan la percepción de producto profesional:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 DESGLOSE DE ANTIPATRONES DETECTADOS                         │
├──────────────────────────────────┬───────┬──────────────────────────────────┤
│ Antipatrón                       │ Cant. │ Severidad                        │
├──────────────────────────────────┼───────┼──────────────────────────────────┤
│ gray-on-color (Texto deslavado)  │  18   │ P1 (Ilegible bajo el sol)        │
│ side-tab (Borde lateral de 4px)  │   7   │ P2 (Tell clásico de plantilla IA)│
│ border-accent-on-rounded         │   2   │ P2 (Choque de radio y borde)     │
│ gradient-text (Texto degradado)  │   1   │ P2 (Ornamento innecesario)       │
│ ai-color-palette (Color fuera)   │   1   │ P2 (Inconsistencia de marca)     │
│ bounce-easing (Rebote anticuado) │   1   │ P3 (Sensación de juego viejo)    │
└──────────────────────────────────┴───────┴──────────────────────────────────┘
```

---

### 1.1. Texto Gris Deslavado sobre Fondos con Color (`[gray-on-color]`) — 18 casos

* **Por qué falla:** Colocar texto gris claro (`text-slate-400`, `text-gray-400`, `text-slate-600`) sobre fondos tenues de color (`bg-red-50`, `bg-purple-50`, `bg-rose-50`, `bg-yellow-50`) crea un efecto deslavado y sucio. Bajo la luz solar en un campo de béisbol, el texto se vuelve **completamente invisible**.
* **La Regla de Impeccable:** *“On colored surfaces tint secondary text from that hue or the foreground; never gray.”* (En superficies con color, entinta el texto secundario con una variante oscura de ese mismo matiz, jamás gris).
* **Instancias Críticas:**
  - `AthleteDashboard.tsx:446, 454, 461, 782, 790, 797`
  - `CategoryDashboard.tsx:280, 287`
  - `ProductDashboard.tsx:378, 385, 524, 531`
  - `StaffDashboard.tsx:342, 539`
  - `TeamDashboard.tsx:246, 253`
  - `PaymentForm.tsx:449`
  - `SettingsDashboard.tsx:718`
* **Corrección Visual:**
  ```tsx
  // ❌ Antes (deslavado e ilegible):
  <span className="bg-red-50 text-slate-400">Pendiente</span>

  // ✅ Después (nítido, accesible y con carácter):
  <span className="bg-rose-50 text-rose-800 font-semibold border border-rose-200/60">
    Pendiente
  </span>
  ```

---

### 1.2. El Borde Lateral Grueso de Tarjetas (`[side-tab] border-l-4`) — 7 casos

* **Por qué falla:** El borde izquierdo de 4px (`border-l-4`) en tarjetas de login, formularios y alertas es el indicador visual número uno de interfaces generadas por plantillas o modelos de IA genéricos. Carece de jerarquía real y se siente como un prototipo apresurado.
* **La Regla de Impeccable:** *“Refuse a colored border-left or border-right above 1px on cards, callouts, or alerts. The card carries its own structure.”*
* **Instancias Críticas:**
  - `admin/login/page.tsx:55`: Card de login administrativo.
  - `portal/login/page.tsx:39`: Card de login de atletas.
  - `portal/link-profile/page.tsx:39`: Formulario de vinculación.
  - `PaymentForm.tsx:254`: Tarjeta informativa de métodos de pago.
  - `admin/page.tsx:403`: Bloque de alerta financiera.
  - `QRCodeDisplay.tsx:25, 26`: Marco del código QR (`border-l-2`, `border-r-2`).
* **Corrección Visual:**
  ```tsx
  // ❌ Antes (típica caja con barra lateral gruesa):
  <div className="bg-white p-6 rounded-2xl border-l-4 border-kasa-vinotinto shadow-md">

  // ✅ Después (tarjeta pulida, refinada y con jerarquía limpia):
  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
  ```

---

### 1.3. Degradados en Tipografía (`[gradient-text]`) — 1 caso

* **Ubicación:** [`src/components/landing/Hero.tsx:43`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/Hero.tsx#L43)
* **Snippet:**
  ```tsx
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-kasa-dorado via-yellow-200 to-kasa-dorado">
    Inteligente
  </span>
  ```
* **Por qué falla:** Los textos con degradados metálicos o multicolores (`bg-clip-text`) son un recurso sobreusado que distrae de la lectura y reduce la nitidez visual en pantallas retina.
* **La Regla de Impeccable:** *“Emphasis comes from weight or size. Use solid colors for text.”*
* **Corrección Visual:**
  ```tsx
  // ✅ Color sólido contundente, nítido y de alto contraste:
  <span className="text-kasa-dorado font-black tracking-tight">
    Inteligente
  </span>
  ```

---

### 1.4. Animación Anticuada de Rebote (`[bounce-easing] animate-bounce`) — 1 caso

* **Ubicación:** [`src/app/portal/dashboard/cantina/CantinaPortalClient.tsx:108`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/portal/dashboard/cantina/CantinaPortalClient.tsx#L108)
* **Por qué falla:** `animate-bounce` tiene un salto vertical constante que cansa la vista del usuario en el móvil y evoca interfaces de 2014.
* **La Regla de Impeccable:** *“Bounce and elastic easing feel dated and tacky. Real objects decelerate smoothly — use exponential easing (ease-out) instead.”*
* **Corrección Visual:**
  ```tsx
  // ❌ Antes:
  <div className="animate-bounce ...">

  // ✅ Después (pulso sutil en respuesta a acciones):
  <div className="transition-transform duration-200 active:scale-95 hover:scale-105">
  ```

---

### 1.5. Discrepancia Cromática de la Marca (`[ai-color-palette]`) — 1 caso

* **Ubicación:** [`src/app/admin/(protected)/page.tsx:317`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/page.tsx#L317)
* **Snippet:** `text-indigo-900` en encabezado del Dashboard.
* **Por qué falla:** La paleta oficial de KsaSport está compuesta por Vinotinto (`#5A0F1D`), Dorado (`#D4AF37`) y Gris pizarra (`#2D3748`). La aparición súbita de un `indigo-900` rompe la coherencia institucional.
* **Corrección Visual:** Reemplazar por `text-slate-900` o `text-kasa-vinotinto`.

---

## ♿ SECCIÓN 2: Auditoría de Accesibilidad (A11y) y Contraste WCAG

---

### 2.1. Falla Crítica de Contraste: Dorado (`#D4AF37`) sobre Blanco

```
Contraste Actual   : 2.11 : 1 ❌ (Falla estrepitosa)
Mínimo WCAG AA     : 4.50 : 1 (Texto normal)
Mínimo WCAG AA     : 3.00 : 1 (Texto grande o iconos)
```

* **Dónde impacta:** En todos los badges, iconos y textos dorados colocados sobre fondos blancos en el Portal del Atleta, la Pizarra de Alineación y la Landing.
* **La Solución Sistemática de Tokens:**
  Separar el Dorado en dos tokens de uso estricto:
  1. **`--color-dorado-display` (`#D4AF37`):** Exclusivo para fondos oscuros (sobre Vinotinto el contraste es 7.1:1 ✅).
  2. **`--color-dorado-text` (`#856404` o `#997A15`):** Exclusivo para tipografía y bordes sobre fondos claros (contraste de 4.8:1 ✅).

---

### 2.2. Botones y Enlaces "Mudos" (Sin Accesibilidad)

* **En [`Navbar.tsx:71, 76`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/Navbar.tsx#L71):**
  Botones para abrir y cerrar el menú móvil sin `aria-label`:
  ```tsx
  // ❌ Antes:
  <button onClick={() => setIsOpen(!isOpen)}>
    <Menu className="w-6 h-6" />
  </button>

  // ✅ Después:
  <button 
    onClick={() => setIsOpen(!isOpen)}
    aria-label={isOpen ? "Cerrar menú principal" : "Abrir menú principal"}
    aria-expanded={isOpen}
    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus:ring-2 focus:ring-kasa-dorado"
  >
    <Menu className="w-6 h-6" />
  </button>
  ```
* **En [`AthleteDashboard.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/athletes/AthleteDashboard.tsx) y [`StaffDashboard.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/staff/StaffDashboard.tsx):**
  Enlaces de llamada telefónica (`<a href="tel:...">`) sin texto accesible. Un lector de pantalla solo pronuncia *"link"*. Agregar `aria-label="Llamar a [Nombre del atleta]"`.

---

### 2.3. Terreno de Juego sin Indicador de Cursor ni Foco

* **En [`LineupField.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/lineup/LineupField.tsx#L94, #L144, #L207) y [`BattingOrderView.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/lineup/BattingOrderView.tsx#L71):**
  Los círculos de posición en el campo de béisbol tienen eventos `onClick`, pero carecen de `cursor-pointer`, `role="button"`, `tabIndex={0}` y anillos de foco `focus-visible:ring-2`. En una tablet o laptop con teclado/trackpad, el usuario no sabe qué elemento es interactivo.

---

## ⚡ SECCIÓN 3: Rendimiento Visual y Carga Perceptual

---

### 3.1. 92 Etiquetas `<img>` Nativas Destruyendo el LCP Móvil

* **Problema:** Los comprobantes de transferencia y avatares subidos por representantes pesan entre 3MB y 8MB cada uno. Al usar `<img>` en lugar de `<Image />` de Next.js, el navegador descarga el archivo original sin redimensionar, agotando el plan de datos móviles de padres y entrenadores y congelando el scroll en smartphones de gama media.
* **Solución:**
  1. Configurar los dominios de Cloudflare R2 y Supabase en `next.config.ts`:
     ```typescript
     const nextConfig: NextConfig = {
       images: {
         remotePatterns: [
           { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
           { protocol: 'https', hostname: '**.supabase.co' }
         ],
       },
     };
     ```
  2. Sustituir `<img>` por `<Image width={...} height={...} alt="..." loading="lazy" />`.

---

### 3.2. Bloqueo Visual por Diálogos Nativos (`window.alert`)

* En pleno campo de juego, cuando un mánager registra un *"Out Defensivo"* en [`LineupField.tsx:56`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/lineup/LineupField.tsx#L56), la pantalla se congela con un `alert('Out Defensivo registrado')`. En un partido en vivo, esto interrumpe el flujo y exige pulsar "Aceptar".
* **Solución:** Reemplazar por un micro-toast flotante de 1.5 segundos con confirmación háptica o visual (ej. destello verde en el dorsal).

---

## 🏟️ SECCIÓN 4: Diseño Deportivo y Tipografía ("Mode: Operate")

La aplicación tiene dos almas muy claras bajo la taxonomía de Impeccable:
1. **Landing Page (`/`):** Modo **Persuade**. Debe enamorar a padres y scouts.
2. **Dashboard y Pizarra (`/admin`, `/portal`):** Modo **Operate**. Los entrenadores y tesoreros están bajo presión de tiempo, ruido y sol.

---

### 4.1. Formateo Numérico Deportivo y Moneda

* **Promedios de Bateo (`AVG`):**  
  En [`AthleteDashboard.tsx:523`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/athletes/AthleteDashboard.tsx#L523) se imprime el valor crudo `{athlete.stats_avg}`, lo que en pantalla muestra `AVG 0.333333333` o `AVG 0.3`.  
  En el béisbol profesional internacional, el average se formatea siempre a **3 decimales sin el cero inicial** (`.333`, `.300`, `.285`).
  ```typescript
  export function formatBattingAvg(avg: number | null | undefined): string {
    if (avg === null || avg === undefined || isNaN(Number(avg))) return '.000';
    return Number(avg).toFixed(3).replace(/^0\./, '.');
  }
  ```
* **Cifras Alineadas (`tabular-nums`):**  
  En las tablas de pagos, montos en Bolívares y números de camiseta, los dígitos saltan de ancho al cambiar. Aplicar la clase `tabular-nums font-mono` para que las columnas contables y estadísticas permanezcan perfectamente alineadas.

---

### 4.2. Correcciones en la Landing Page

1. **Eliminar el Kicker / Eyebrow:** En [`Hero.tsx:27`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/Hero.tsx#L27), eliminar la píldora flotante `"Inscripciones Abiertas 2026"` sobre el H1. El título principal de KsaSport debe liderar con contundencia tipográfica.
2. **Reparar Enlaces Rotos:**
   - [`EventShowcase.tsx:91`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/EventShowcase.tsx#L91): Cambiar `href="#registro"` por `href="/portal/login"`.
   - [`Footer.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/Footer.tsx): Sustituir los textos planos `"Ig"` y `"Fb"` por iconos SVG reales de Instagram y Facebook enlazados a las cuentas oficiales de la academia.
3. **Copywriting en Botones de Acción (CTAs):**
   - Cambiar el genérico *"Ver Próximos Tryouts"* por *"Inscribirme al Tryout 2026"*.
   - Cambiar *"Explorar Ligas Activas"* por *"Ver Calendario de Torneos"*.

---

## 🛠️ SECCIÓN 5: Plan de Ejecución Visual Paso a Paso

A continuación se presenta la lista de cambios visuales ordenados para ser implementados en código:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHECKLIST VISUAL IMPECCABLE (48H)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRIORIDAD ALTA (Accesibilidad y Contraste)                                  │
│  [ ] 1. Corregir los 18 casos de text-slate-400 sobre fondos tenues de color│
│  [ ] 2. Crear token --color-dorado-text (#856404) para textos sobre blanco  │
│  [ ] 3. Agregar aria-labels en botones móviles de Navbar y enlaces de tel:  │
│  [ ] 4. Agregar cursor-pointer y focus-visible en posiciones de LineupField │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRIORIDAD MEDIA (Pulido de Antipatrones)                                    │
│  [ ] 5. Eliminar bordes border-l-4 en modales de login y portal             │
│  [ ] 6. Reemplazar animate-bounce en Cantina por scale micro-interactivo    │
│  [ ] 7. Eliminar degradado bg-clip-text en Hero.tsx (usar oro sólido)       │
│  [ ] 8. Corregir link roto #registro y botones de redes en Footer           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRIORIDAD RENDIMIENTO Y DETALLES                                            │
│  [ ] 9. Formatear números deportivos (AVG .000) y tabular-nums en finanzas  │
│  [ ] 10. Reemplazar alert() nativo en LineupField por toast no intrusivo    │
│  [ ] 11. Habilitar remotePatterns en next.config.ts para imágenes Next.js   │
└─────────────────────────────────────────────────────────────────────────────┘
```
