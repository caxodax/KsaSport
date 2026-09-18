-- ==========================================
-- Migración: Productos y Finanzas (Fase 3)
-- ==========================================

-- 1. Crear tabla de Productos (Catálogo)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '[]'::jsonb, -- Array de strings con los nombres de categorías, vacío = Global
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar que la tabla Pagos exista y tenga relación con productos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL,
    concept VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Completado, Rechazado
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Por si ya existía la tabla payments de la fase 2 sin el product_id)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
