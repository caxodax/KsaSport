-- ==========================================================
-- KsaSports - Módulo Autónomo de Cantina y Línea de Crédito
-- ==========================================================

-- 1. Categorías de Alimentos y Bebidas
CREATE TABLE IF NOT EXISTS public.food_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Catálogo de Productos de Cantina (Sin fotos, precios en USD)
CREATE TABLE IF NOT EXISTS public.food_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    category_id UUID REFERENCES public.food_categories(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Cuentas de Crédito por Atleta
CREATE TABLE IF NOT EXISTS public.food_credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE UNIQUE,
    credit_limit NUMERIC(10,2) NOT NULL DEFAULT 50.00,
    balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Órdenes / Ventas de Cantina (Asignadas a los Atletas)
CREATE TABLE IF NOT EXISTS public.food_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Detalle de Ítems por Orden
CREATE TABLE IF NOT EXISTS public.food_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.food_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 6. Pagos / Abonos de Cantina
CREATE TABLE IF NOT EXISTS public.food_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.food_credit_accounts(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    transferred_amount NUMERIC(14,2),
    exchange_rate NUMERIC(12,4),
    method TEXT NOT NULL,
    reference_number TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Completado', 'Rechazado'
    registered_by TEXT NOT NULL DEFAULT 'athlete', -- 'athlete', 'admin'
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ
);

-- Índices de Alta Velocidad para Filtros y Búsquedas
CREATE INDEX IF NOT EXISTS idx_food_products_category ON public.food_products(category_id);
CREATE INDEX IF NOT EXISTS idx_food_products_available ON public.food_products(is_available);
CREATE INDEX IF NOT EXISTS idx_food_credit_accounts_athlete ON public.food_credit_accounts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_athlete ON public.food_orders(athlete_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_created ON public.food_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_food_order_items_order ON public.food_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_food_payments_athlete ON public.food_payments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_food_payments_status ON public.food_payments(status);
CREATE INDEX IF NOT EXISTS idx_food_payments_created ON public.food_payments(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Public read food_categories" ON public.food_categories;
CREATE POLICY "Public read food_categories" ON public.food_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read food_products" ON public.food_products;
CREATE POLICY "Public read food_products" ON public.food_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Athletes view own food_credit_accounts" ON public.food_credit_accounts;
CREATE POLICY "Athletes view own food_credit_accounts" ON public.food_credit_accounts FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Athletes view own food_orders" ON public.food_orders;
CREATE POLICY "Athletes view own food_orders" ON public.food_orders FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Athletes view own food_payments" ON public.food_payments;
CREATE POLICY "Athletes view own food_payments" ON public.food_payments FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

-- Service Role (Backend/Admin) tiene acceso total a todas las tablas
DROP POLICY IF EXISTS "Service role full access food_categories" ON public.food_categories;
CREATE POLICY "Service role full access food_categories" ON public.food_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access food_products" ON public.food_products;
CREATE POLICY "Service role full access food_products" ON public.food_products FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access food_credit_accounts" ON public.food_credit_accounts;
CREATE POLICY "Service role full access food_credit_accounts" ON public.food_credit_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access food_orders" ON public.food_orders;
CREATE POLICY "Service role full access food_orders" ON public.food_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access food_order_items" ON public.food_order_items;
CREATE POLICY "Service role full access food_order_items" ON public.food_order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access food_payments" ON public.food_payments;
CREATE POLICY "Service role full access food_payments" ON public.food_payments FOR ALL USING (true);

-- Semilla de Categorías Iniciales
INSERT INTO public.food_categories (name) VALUES 
('Desayunos'),
('Almuerzos'),
('Bebidas'),
('Snacks / Golosinas')
ON CONFLICT (name) DO NOTHING;

-- Semilla de Productos Iniciales de Cantina
INSERT INTO public.food_products (name, description, price, category_id, is_available)
SELECT 'Empanada Mechada', 'Empanada frita rellena de carne mechada', 1.50, id, true
FROM public.food_categories WHERE name = 'Desayunos'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.food_products (name, description, price, category_id, is_available)
SELECT 'Empanada Queso', 'Empanada frita rellena de queso blanco', 1.20, id, true
FROM public.food_categories WHERE name = 'Desayunos'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.food_products (name, description, price, category_id, is_available)
SELECT 'Malta Polar 250ml', 'Bebida de malta fría', 1.00, id, true
FROM public.food_categories WHERE name = 'Bebidas'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.food_products (name, description, price, category_id, is_available)
SELECT 'Agua Mineral 500ml', 'Agua mineral envasada', 0.80, id, true
FROM public.food_categories WHERE name = 'Bebidas'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.food_products (name, description, price, category_id, is_available)
SELECT 'Galleta de Avena', 'Snack nutritivo para deportistas', 0.75, id, true
FROM public.food_categories WHERE name = 'Snacks / Golosinas'
LIMIT 1
ON CONFLICT DO NOTHING;
