# 🛡️ Auditoría Crítica Pre-Producción KsaSport
**Fecha:** Octubre 2026 | **Horizonte a Producción:** 48 Horas  
**Clasificación:** P0 (Bloqueante) · P1 (Crítico) · P2 (Importante / UX)  
**Objetivo:** Identificación exhaustiva de vulnerabilidades, riesgos operativos y plan técnico exacto de remediación antes de recibir usuarios reales.

---

## 📌 Resumen Ejecutivo y Diagnóstico Brutalmente Honesto

El proyecto **KsaSport** posee un diseño visual moderno, reglas de negocio bimonetarias adaptadas a Venezuela (BCV USD/EUR y USDT) y una lógica deportiva bien concebida. Sin embargo, **no está listo para producción en su estado actual**. 

Existen **vulnerabilidades de severidad crítica (P0)** que permitirían a cualquier usuario anónimo en internet:
1. Eliminar atletas, categorías, equipos o productos.
2. Aprobar o rechazar pagos bancarios sin autenticación.
3. Auto-promoverse al rol de Administrador/Coach.
4. Leer y escribir directamente sobre la base de datos de Supabase evadiendo toda la seguridad debido a la falta de RLS (*Row Level Security*).

Adicionalmente, hay condiciones de carrera en el manejo de saldos de cantina, un bug de zona horaria que resta 1 día a las solvencias de los atletas, y 126 errores de linter que romperán cualquier pipeline de CI/CD.

A continuación se detalla cada hallazgo con su **diagnóstico técnico, archivos afectados y el código exacto para corregirlo**.

---

## 🚨 SECCIÓN 1: Vulnerabilidades Críticas de Seguridad (P0 - Bloqueantes)

---

### 1.1. Server Actions Administrativas 100% Desprotegidas (Bypass de RLS)

#### Diagnóstico:
En Next.js App Router, todas las funciones dentro de archivos `'use server'` son transformadas por el compilador en endpoints HTTP POST públicos. La protección definida en `src/app/admin/(protected)/layout.tsx` **solo protege la renderización visual de páginas**, pero **no protege las llamadas a Server Actions**.

Actualmente, las acciones administrativas usan `getServiceSupabase()`, el cual utiliza la `SUPABASE_SERVICE_ROLE_KEY` (clave maestra que ignora todo RLS en PostgreSQL), **sin verificar si el usuario que invoca la acción tiene sesión iniciada ni cuáles son sus permisos**.

#### Archivos Afectados:
- `src/app/admin/(protected)/payments/actions.ts` (`approvePayment`, `rejectPayment`)
- `src/app/admin/(protected)/athletes/actions.ts` (`createAthlete`, `deleteAthlete`, `updateAthlete`)
- `src/app/admin/(protected)/athletes/[id]/actions.ts` (`toggleExemption`, `toggleAthleteAlliance`)
- `src/app/admin/(protected)/teams/actions.ts` (`createTeam`, `deleteTeam`, `updateTeam`)
- `src/app/admin/(protected)/categories/actions.ts` (`createCategory`, `deleteCategory`, `updateCategory`)
- `src/app/admin/(protected)/products/actions.ts` (`createProduct`, `toggleProductStatus`, `deleteProduct`, `updateProduct`)
- `src/app/admin/(protected)/staff/actions.ts` (`createStaff`, `deleteStaff`, `updateStaff`)
- `src/app/admin/(protected)/lineup/actions.ts` (`assignPosition`, `unassignPosition`, `updateBattingOrder`, `addOffensiveStat`, `addDefensiveStat`)
- `src/app/admin/(protected)/settings/actions.ts` (`updateGlobalSettings`, `updateCategoryPenalty`)
- `src/app/admin/(protected)/settings/rate-actions.ts` (`syncRatesNow`, `saveManualRateAction`)

#### Cómo Corregirlo:
Importar y llamar obligatoriamente `checkAdminPermission()` en la primera línea de cada función del servidor.

**Ejemplo en `src/app/admin/(protected)/payments/actions.ts`:**
```typescript
'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'

export async function approvePayment(paymentId: string, athleteId: string, concept: string) {
  // 1. Blindaje de seguridad obligatorio:
  await checkAdminPermission('view_finances');
  
  const supabase = getServiceSupabase();
  // ... resto del código
}

export async function rejectPayment(paymentId: string) {
  // 1. Blindaje de seguridad obligatorio:
  await checkAdminPermission('view_finances');
  
  const supabase = getServiceSupabase();
  // ... resto del código
}
```

**Ejemplo en `src/app/admin/(protected)/athletes/actions.ts`:**
```typescript
'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import { revalidatePath } from 'next/cache';
import { cleanCedula } from '@/lib/cedula';

export async function deleteAthlete(id: string) {
  // Solo superadmin o administradores con permiso del catálogo/roster pueden eliminar
  await checkAdminPermission('manage_catalog');
  
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('athletes').delete().eq('id', id);
  // ...
}
```

---

### 1.2. Ausencia Total de Row Level Security (RLS) en Tablas Principales

#### Diagnóstico:
La clave pública de Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) está visible para cualquiera en el frontend. Si una tabla no tiene activado RLS, **PostgREST permite a cualquier usuario no autenticado consultar, insertar, modificar o borrar datos directamente vía REST**.
Tablas críticas como `athletes`, `payments`, `admin_users`, `admin_roles`, `staff`, `teams`, `categories`, `products` y `club_settings` no cuentan con RLS activado en los scripts de migración.

#### Impacto:
Un atacante puede enviar un `POST` con la clave anónima a `/rest/v1/admin_users` asociando su propio UID con el rol `superadmin`, tomando control absoluto de la base de datos.

#### Cómo Corregirlo:
Ejecutar inmediatamente este script SQL en el editor de Supabase antes del despliegue:

```sql
-- 1. Habilitar RLS en todas las tablas desprotegidas
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de lectura pública requeridas (para Portal, Verificación QR y Landing)
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read exchange rates" ON public.exchange_rate_history FOR SELECT USING (true);

-- 3. Verificación QR de atletas (Lectura pública limitada)
CREATE POLICY "Public read athlete verification" ON public.athletes 
FOR SELECT USING (true);

-- 4. Portal del Atleta: Un usuario autenticado solo puede leer sus propios datos y pagos
CREATE POLICY "Athletes view own profile" ON public.athletes 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Athletes view own payments" ON public.payments 
FOR SELECT USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

-- NOTA: Las mutaciones administrativas no requieren políticas permisivas en Postgres
-- porque el backend utiliza getServiceSupabase() con la SERVICE_ROLE_KEY,
-- la cual bypasséa RLS de forma nativa y segura.
```

---

### 1.3. Falsa Política de Seguridad "Service Role" en Cantina

#### Diagnóstico:
En [`supabase/migrations/food_cantina_schema.sql`](file:///home/lmontes/Documentos/Telegram/KsaSport/supabase/migrations/food_cantina_schema.sql#L114-L131), se redactaron políticas destinadas supuestamente al Service Role de la siguiente forma:
```sql
CREATE POLICY "Service role full access food_payments" ON public.food_payments FOR ALL USING (true);
CREATE POLICY "Service role full access food_credit_accounts" ON public.food_credit_accounts FOR ALL USING (true);
```
Al no incluir `TO service_role`, PostgreSQL aplica la política a `PUBLIC`. Esto otorga permisos totales (lectura, inserción, actualización y borrado) a **cualquier cliente anónimo** con la anon key sobre cuentas de crédito, órdenes y pagos de cantina.

#### Cómo Corregirlo:
Ejecutar en Supabase:
```sql
DROP POLICY IF EXISTS "Service role full access food_categories" ON public.food_categories;
DROP POLICY IF EXISTS "Service role full access food_products" ON public.food_products;
DROP POLICY IF EXISTS "Service role full access food_credit_accounts" ON public.food_credit_accounts;
DROP POLICY IF EXISTS "Service role full access food_orders" ON public.food_orders;
DROP POLICY IF EXISTS "Service role full access food_order_items" ON public.food_order_items;
DROP POLICY IF EXISTS "Service role full access food_payments" ON public.food_payments;
```

---

### 1.4. Auto-escalada de Privilegios Administrativos en `linkProfile`

#### Diagnóstico:
En [`src/app/portal/actions.ts`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/portal/actions.ts#L127-L141), si un usuario se registra y coloca una cédula que coincida con un registro en la tabla `staff`, el sistema le otorga inmediatamente acceso al panel administrativo:
```typescript
const { error: adminError } = await adminSupabase
  .from('admin_users')
  .insert({
    id: user.id,
    email: user.email,
    role_id: 'coach'
  });
```
Como las cédulas son datos públicos en el deporte menor, cualquier persona puede crear una cuenta con un correo temporal, tipear la cédula de un coach y entrar al panel de administración.

#### Cómo Corregirlo:
Eliminar la inserción automática en `admin_users` dentro del portal. Los accesos administrativos deben ser otorgados manualmente por el Superadministrador desde `/admin/users`:

```typescript
// En src/app/portal/actions.ts (linkProfile):
if (staff) {
  if (staff.user_id && staff.user_id !== user.id) {
    return { error: 'Esta cédula ya está vinculada a otra cuenta de staff.' }
  }
  const { error: updateError } = await adminSupabase
    .from('staff')
    .update({ user_id: user.id })
    .eq('id', staff.id);
    
  if (updateError) return { error: 'Ocurrió un error al vincular el perfil de staff.' }

  // ELIMINAR EL BLOQUE QUE INSERTA EN admin_users AUTOMÁTICAMENTE.
  // Notificar al usuario que su perfil está vinculado y contacte al SuperAdmin si requiere acceso al panel.
}
```

---

### 1.5. Endpoints de Cron Jobs Desprotegidos

#### Diagnóstico:
En `src/app/api/cron/sync-rates/route.ts` y `src/app/api/cron/daily-status/route.ts`:
```typescript
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
Si la variable `CRON_SECRET` no está configurada en `.env.local` o en Vercel, `cronSecret` es `undefined`, la condición se salta y el endpoint queda **completamente público**.

#### Cómo Corregirlo:
Exigir `CRON_SECRET` de forma estricta:
```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### 1.6. Uso de `supabase.auth.getSession()` en lugar de `getUser()`

#### Diagnóstico:
En múltiples páginas y acciones del portal:
- `src/app/portal/page.tsx:6`
- `src/app/portal/actions.ts:149`
- `src/app/portal/dashboard/page.tsx:17`
- `src/app/portal/dashboard/pagos/page.tsx:11`
- `src/app/portal/dashboard/cantina/page.tsx:11`
- `src/app/portal/dashboard/cantina/actions.ts:10`

Se utiliza `getSession()`. Como estipula la documentación oficial de Supabase, `getSession()` solo lee cookies locales sin validar su autenticidad criptográfica en el servidor de Auth, por lo que **no debe utilizarse para proteger rutas ni mutaciones en el servidor**.

#### Cómo Corregirlo:
Reemplazar sistemáticamente por:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  redirect('/portal/login');
}
```

---

## 💰 SECCIÓN 2: Lógica Financiera, Concurrencia y Datos (Riesgos P1)

---

### 2.1. Condición de Carrera (*Race Condition*) en Cuentas de Crédito y Cantina

#### Diagnóstico:
En [`src/app/admin/(protected)/cantina/actions.ts`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/cantina/actions.ts#L103-L110), el nuevo saldo se calcula en la memoria de JavaScript y se envía mediante un `update`:
```typescript
const newBalance = Number((Number(account.balance || 0) + total).toFixed(2))
await supabase.from('food_credit_accounts').update({ balance: newBalance }).eq('id', account.id)
```
Si se registran dos consumos casi al mismo tiempo o se procesa un abono en el mostrador mientras se crea una comanda, **uno de los dos cálculos sobreescribe al otro (*Lost Update*)**, generando discrepancias contables irreversibles.

#### Cómo Corregirlo:
Crear una función SQL atómica en PostgreSQL:
```sql
CREATE OR REPLACE FUNCTION increment_food_balance(p_athlete_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE public.food_credit_accounts
  SET balance = GREATEST(0, balance + p_amount),
      updated_at = NOW()
  WHERE athlete_id = p_athlete_id
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```
Y consumirla desde el Server Action con `supabase.rpc('increment_food_balance', { p_athlete_id: athleteId, p_amount: total })`.

---

### 2.2. Aprobación de Pagos no Atómica

#### Diagnóstico:
En [`src/app/admin/(protected)/payments/actions.ts`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/payments/actions.ts#L13-L69), el sistema actualiza primero el pago a `Completado` y luego en una llamada HTTP separada actualiza el atleta a `Solvente`. Si la segunda llamada falla por pérdida de red o timeout, el pago queda registrado como recibido pero el atleta permanece bloqueado como `Moroso`.

#### Cómo Corregirlo:
Utilizar una función RPC en PostgreSQL para que ambas actualizaciones ocurran dentro de una misma transacción (`BEGIN ... COMMIT`).

---

### 2.3. Valores Mágicos Hardcodeados en Tasas de Cambio

#### Diagnóstico:
- En `src/lib/exchangeRate.ts:144`: `let usdt = 960.00;`
- En `src/lib/exchangeRate.ts:370-372`: fallbacks fijos de `842.2067` (USD) y `977.8778` (EUR).
- En `src/app/portal/dashboard/pagos/PaymentForm.tsx:62-63`: `968.0673` (EUR) y `832.4883` (USD).

Si la API de tasas falla, la aplicación cobrará montos calculados con valores quemados en código de hace semanas, generando pérdidas financieras por cobro insuficiente o reclamos por sobreprecio.

#### Cómo Corregirlo:
El fallback debe ser **estrictamente la última tasa registrada exitosamente en `club_settings` o en `exchange_rate_history`**. Si la base de datos no tiene ninguna tasa, el sistema debe alertar al administrador y bloquear pagos en bolívares hasta que se registre la tasa oficial del día.

---

### 2.4. Bug de Zona Horaria en Fechas de Vencimiento (`toLocaleDateString`)

#### Diagnóstico:
El campo `paid_until` se almacena como string `"YYYY-MM-DD"`. En JavaScript del cliente, `new Date("2026-10-31")` se parsea como medianoche UTC (`2026-10-31T00:00:00Z`).  
En Venezuela (`UTC-4`), al invocar:
```typescript
new Date(athlete.paid_until).toLocaleDateString('es-ES')
```
La fecha se desplaza 4 horas hacia atrás, convirtiéndose en el **30 de octubre a las 20:00 hrs**.  
Tanto el carnet QR público como el portal del atleta muestran que la mensualidad vence un día antes de la fecha real.

#### Cómo Corregirlo:
Formatear forzando el huso horario o agregando mediodía UTC:
```typescript
export function formatLocalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const [year, month, day] = clean.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
```

---

### 2.5. Atletas Invisibles en el Dashboard Principal

#### Diagnóstico:
En [`src/app/admin/(protected)/page.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/page.tsx#L32) y [línea 69](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/page.tsx#L69), las consultas usan:
```typescript
athletesQuery = supabase.from('athletes').select('id, name, teams!inner(id, name, category)', { count: 'exact' });
```
El modificador `!inner` genera un `INNER JOIN`. Cualquier atleta que no tenga equipo asignado (`team_id: null`) es **descartado de la consulta**, volviéndose invisible en la tabla de atletas y en las métricas de ingresos.

#### Cómo Corregirlo:
Cambiar `teams!inner` a un join opcional `teams(id, name, category)` salvo cuando exista un filtro explícito de categoría.

---

## ⚡ SECCIÓN 3: Rendimiento, Calidad de Código y Estabilidad (P1 / P2)

---

### 3.1. Pipeline de CI/CD: 126 Errores de ESLint

#### Diagnóstico:
Al correr `npm run lint`, el proceso falla con código de salida `1` y **126 errores**.  
Principales causas:
1. `react-hooks/set-state-in-effect` (13 errores): En todos los Drawers (`AthleteDrawer`, `ProductDrawer`, `StaffDrawer`, etc.) se sincroniza el estado con `useEffect` al editar.
2. `react-hooks/purity` en `PaymentForm.tsx:76`: Llamada a `Date.now()` impura durante el render.
3. `@typescript-eslint/no-explicit-any` (88 errores).

#### Cómo Corregirlo:
- **Para los Drawers:** En lugar de `useEffect`, pasar un prop `key={editingAthlete?.id || 'new'}` desde el componente padre. Esto fuerza a React a recrear el componente limpiamente con sus valores iniciales, eliminando el `useEffect` y los renders en cascada.
- **Para `PaymentForm.tsx`:** Generar los IDs únicos dentro de manejadores de eventos (`handleSelect`, `handleAddSplit`) o usar `crypto.randomUUID()`.

---

### 3.2. Sobrecarga de Bundle Client-Side por `exceljs`

#### Diagnóstico:
La librería `exceljs` (~1.5 MB) está importada estáticamente en componentes cliente (`AthleteDashboard.tsx`, `CantinaHub.tsx`). Todo usuario que entra a la sección en un smartphone descarga la librería completa incluso si nunca presiona el botón "Exportar a Excel".

#### Cómo Corregirlo:
Convertir la exportación en un Route Handler de servidor (`GET /api/admin/export/athletes?team=...`) que devuelva el archivo binario `.xlsx`, o cargar la librería dinámicamente:
```typescript
const handleExport = async () => {
  const { exportAthletesToExcel } = await import('@/lib/exportExcel');
  await exportAthletesToExcel(athletesData);
};
```

---

### 3.3. Ausencia Total de Error Boundaries y Loading States

#### Diagnóstico:
No existe ningún archivo `error.tsx`, `loading.tsx` ni `not-found.tsx` en `src/app`.
- Si una Server Component tarda en responder, la pantalla se queda inmóvil sin indicador de carga.
- Si una consulta falla por timeout o error de base de datos, el usuario recibe la pantalla blanca de error 500 de Next.js sin opción de recuperación.

#### Cómo Corregirlo:
Crear:
- `src/app/loading.tsx`: Skeleton o spinner con los colores corporativos.
- `src/app/error.tsx`: Pantalla de error con botón `reset()` para reintentar la acción.

---

### 3.4. Almacenamiento Inseguro de Archivos (`cloudflare.ts`)

#### Diagnóstico:
En [`src/lib/cloudflare.ts:15`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/lib/cloudflare.ts#L15):
```typescript
const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000)
```
- Espacio aleatorio diminuto (1,000 posibilidades), vulnerable a colisiones bajo concurrencia.
- No se valida el tipo MIME real (permitiendo subir archivos no deseados o `.svg` con scripts).
- No hay validación previa de tamaño antes de enviarlo al servidor (generando errores `413` de Vercel).

#### Cómo Corregirlo:
- Usar `crypto.randomUUID()`.
- Validar en el cliente y servidor que `file.size <= 5 * 1024 * 1024` (5MB máximo) y que el tipo sea `image/jpeg`, `image/png` o `image/webp`.

---

## 🎨 SECCIÓN 4: UI/UX, Accesibilidad y Marca (P2)

---

### 4.1. Falla Crítica de Contraste WCAG AA: Dorado (`#D4AF37`) sobre Blanco

#### Diagnóstico:
El contraste del color `--kasa-dorado` (`#D4AF37`) sobre blanco (`#FFFFFF`) o fondo gris (`#F8FAFC`) es de apenas **2.11:1**, incumpliendo el estándar mínimo de accesibilidad WCAG AA (mínimo **4.5:1**).  
En dispositivos móviles bajo luz solar directa en un campo deportivo, los textos dorados sobre fondo claro son completamente invisibles.

#### Cómo Corregirlo:
- Mantener `#D4AF37` únicamente sobre fondos oscuros (como el vinotinto institucional `#5A0F1D`, donde el contraste es excelente: ~7:1).
- Para textos y badges sobre fondo blanco o claro, utilizar un tono dorado profundo de alto contraste: `#997A15` o `#856404` (contraste > 4.6:1).

---

### 4.2. Enlaces Rotos y Placeholders en la Landing Page

#### Diagnóstico:
- En [`EventShowcase.tsx:91`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/EventShowcase.tsx#L91): el botón *"Ver Fechas Disponibles"* apunta a `href="#registro"`, ancla que no existe en el DOM.
- En [`Footer.tsx`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/components/landing/Footer.tsx):
  - Botones sociales simulados con texto plano `"Ig"` y `"Fb"` sin enlaces reales.
  - Enlaces de *Preguntas Frecuentes*, *Términos y Condiciones* y *Contacto* apuntan a `href="#"`.

#### Cómo Corregirlo:
- Reemplazar `#registro` por el enlace directo al portal de registro o formulario de contacto.
- Colocar los enlaces reales a las redes de KsaSport o remover temporalmente los botones placeholder.

---

### 4.3. Falta de Favicon Oficial y Metadatos PWA

#### Diagnóstico:
- El archivo `src/app/favicon.ico` es el logotipo predeterminado de Vercel/Next.js.
- No existe `manifest.json` ni `apple-touch-icon.png`. Cuando un representante agrega la página a la pantalla de inicio de su teléfono, se muestra el icono de Next.js en lugar del emblema de KsaSport.

---

### 4.4. Diálogos Nativos Bloqueantes (`window.alert` y `window.confirm`)

#### Diagnóstico:
En [`LineupField.tsx:56`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/lineup/LineupField.tsx#L56) (`alert('Out Defensivo...')`), [`PaymentRow.tsx:95`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/payments/PaymentRow.tsx#L95) y [`ExemptionManager.tsx:37`](file:///home/lmontes/Documentos/Telegram/KsaSport/src/app/admin/(protected)/athletes/[id]/ExemptionManager.tsx#L37).  
Los diálogos `alert()` y `confirm()` detienen el hilo de ejecución del navegador, fallan dentro de WebViews (navegadores de WhatsApp/Instagram) y transmiten sensación de prototipo inacabado.

#### Cómo Corregirlo:
Reemplazar por notificaciones flotantes (*toasts*) no intrusivas o modales de confirmación con Tailwind.

---

## 📋 SECCIÓN 5: Plan de Acción Priorizado para las Próximas 48 Horas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HOJA DE RUTA 48H A PRODUCCIÓN                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ DÍA 1: SEGURIDAD, BASE DE DATOS Y CONCURRENCIA                              │
│  [X] 1. Ejecutar script de RLS en Supabase (Sección 1.2).                   │
│  [X] 2. Eliminar políticas erróneas en food_cantina_schema.sql (1.3).       │
│  [X] 3. Agregar checkAdminPermission() en todas las Server Actions (1.1).   │
│  [X] 4. Retirar auto-promoción a rol coach en linkProfile (1.4).            │
│  [X] 5. Reemplazar getSession() por getUser() en todo el portal (1.6).      │
│  [X] 6. Proteger rutas cron con obligatoriedad de CRON_SECRET (1.5).        │
│  [X] 7. Crear función SQL atómica para balance de cantina (2.1).            │
│  [X] 8. Corregir teams!inner por join opcional en admin/page.tsx (2.5).     │
│  [X] 9. Corregir bug de zona horaria de toLocaleDateString en paid_until (2.4).│
├─────────────────────────────────────────────────────────────────────────────┤
│ DÍA 2: ESTABILIDAD, PERFORMANCE Y REFINAMIENTO UX                           │
│  [ ] 10. Eliminar useEffects en Drawers usando keys en el componente (3.1). │
│  [ ] 11. Corregir impureza de Date.now() en PaymentForm.tsx (3.1).          │
│  [ ] 12. Implementar dynamic import para exceljs (3.2).                     │
│  [ ] 13. Crear src/app/loading.tsx y src/app/error.tsx (3.3).               │
│  [ ] 14. Robustecer uploadImageToCloudflare (UUID y límites de archivo) (3.4).│
│  [ ] 15. Ajustar contraste de texto dorado sobre fondo claro (4.1).         │
│  [ ] 16. Corregir enlaces rotos y redes en Landing Page (4.2).              │
│  [ ] 17. Reemplazar favicon.ico por el escudo oficial de KsaSport (4.3).    │
│  [ ] 18. Reemplazar alerts nativos por toasts no bloqueantes (4.4).         │
└─────────────────────────────────────────────────────────────────────────────┘
```
