-- ==============================================================================
-- KASA SPORTS: MIGRACIÓN DE HARDENING DE SEGURIDAD Y RLS (Puntos 1.2 y 1.3)
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas del sistema
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.athlete_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.athlete_product_opt_ins ENABLE ROW LEVEL SECURITY;

-- Tablas del módulo de Cantina
ALTER TABLE IF EXISTS public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_payments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Eliminar políticas inseguras previas (incluyendo la falsa política de Service Role de Cantina)
-- ==============================================================================
DROP POLICY IF EXISTS "Service role full access food_categories" ON public.food_categories;
DROP POLICY IF EXISTS "Service role full access food_products" ON public.food_products;
DROP POLICY IF EXISTS "Service role full access food_credit_accounts" ON public.food_credit_accounts;
DROP POLICY IF EXISTS "Service role full access food_orders" ON public.food_orders;
DROP POLICY IF EXISTS "Service role full access food_order_items" ON public.food_order_items;
DROP POLICY IF EXISTS "Service role full access food_payments" ON public.food_payments;

-- Limpieza idempotente de políticas
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Public read exchange rates" ON public.exchange_rate_history;
DROP POLICY IF EXISTS "Public read staff" ON public.staff;
DROP POLICY IF EXISTS "Public read club settings" ON public.club_settings;
DROP POLICY IF EXISTS "Public read food_categories" ON public.food_categories;
DROP POLICY IF EXISTS "Public read food_products" ON public.food_products;

DROP POLICY IF EXISTS "Athletes view own profile" ON public.athletes;
DROP POLICY IF EXISTS "Athletes view own payments" ON public.payments;
DROP POLICY IF EXISTS "Athletes view own food_credit_accounts" ON public.food_credit_accounts;
DROP POLICY IF EXISTS "Athletes view own food_orders" ON public.food_orders;
DROP POLICY IF EXISTS "Athletes view own food_order_items" ON public.food_order_items;
DROP POLICY IF EXISTS "Athletes view own food_payments" ON public.food_payments;

-- ==============================================================================
-- 3. Catálogo y Datos Públicos de Solo Lectura (SELECT)
-- ==============================================================================
CREATE POLICY "Public read teams" ON public.teams 
FOR SELECT USING (true);

CREATE POLICY "Public read categories" ON public.categories 
FOR SELECT USING (true);

CREATE POLICY "Public read active products" ON public.products 
FOR SELECT USING (is_active = true);

CREATE POLICY "Public read exchange rates" ON public.exchange_rate_history 
FOR SELECT USING (true);

CREATE POLICY "Public read staff" ON public.staff 
FOR SELECT USING (true);

CREATE POLICY "Public read club settings" ON public.club_settings 
FOR SELECT USING (true);

CREATE POLICY "Public read food_categories" ON public.food_categories 
FOR SELECT USING (true);

CREATE POLICY "Public read food_products" ON public.food_products 
FOR SELECT USING (is_available = true);

-- ==============================================================================
-- 4. Portal del Atleta: Restricción estricta por auth.uid() (SELECT)
-- ==============================================================================
CREATE POLICY "Athletes view own profile" ON public.athletes 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Athletes view own payments" ON public.payments 
FOR SELECT USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

CREATE POLICY "Athletes view own food_credit_accounts" ON public.food_credit_accounts 
FOR SELECT USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

CREATE POLICY "Athletes view own food_orders" ON public.food_orders 
FOR SELECT USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

CREATE POLICY "Athletes view own food_order_items" ON public.food_order_items 
FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.food_orders 
    WHERE athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Athletes view own food_payments" ON public.food_payments 
FOR SELECT USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

-- ==============================================================================
-- NOTAS DE SEGURIDAD ARQUITECTÓNICA:
-- 1. admin_users y admin_roles NO poseen ninguna política pública/anónima. 
--    PostgREST deniega por defecto todo acceso externo a estas tablas. Solo el backend
--    autorizado con la SERVICE_ROLE_KEY puede consultar y administrar roles.
-- 2. Ninguna tabla permite INSERT, UPDATE ni DELETE anónimo o directo vía PostgREST;
--    todas las operaciones de escritura del sistema son procesadas de forma controlada
--    a través de Server Actions protegidas en Next.js.
-- ==============================================================================
