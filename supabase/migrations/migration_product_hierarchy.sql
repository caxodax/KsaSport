-- ==============================================================================
-- MIGRACIÓN: JERARQUÍA DE PRODUCTOS (TORNEO PADRE -> JORNADAS / SEMANAS HIJAS)
-- KASA SPORTS
-- ==============================================================================

-- 1. Agregar columna parent_product_id a la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- 2. Índice para consultas y filtros rápidos por producto padre
CREATE INDEX IF NOT EXISTS idx_products_parent_product_id ON public.products(parent_product_id);

COMMENT ON COLUMN public.products.parent_product_id IS 'ID del producto torneo padre del cual se deriva esta cuota semanal o jornada.';
