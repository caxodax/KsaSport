-- ==========================================
-- Migración: Crear tabla de Staff Técnico
-- ==========================================

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    cedula VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL, -- Mánager, Entrenador, Asistente Técnico, Preparador Físico, Delegado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS si aplica (opcional)
-- ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
