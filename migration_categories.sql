-- ==========================================
-- Migración: Tabla de Categorías
-- ==========================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las categorías base que ya veníamos usando
INSERT INTO categories (name) VALUES 
('Infantil'), 
('Pre-Junior'), 
('Junior'), 
('Libre'), 
('Master');
