-- ==========================================
-- Kasa Sports - Supabase Schema & Thick DB
-- ==========================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tablas Principales

-- Equipos
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atletas
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE, -- Vínculo con Supabase Auth
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    cedula VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Solvente', -- Solvente, Moroso, Inactivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Técnico
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    cedula VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagos (Payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL, -- Cashea, Bancamiga, Efectivo
    concept VARCHAR(255) NOT NULL, -- Mensualidad, Amistoso, Tryout
    status VARCHAR(50) DEFAULT 'Completado', -- Completado, Pendiente, Rechazado
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Thick DB Logic: Funciones y Triggers

-- Función: Actualizar estatus de atleta tras un pago exitoso
CREATE OR REPLACE FUNCTION update_athlete_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el pago es de una mensualidad y está completado, ponemos al atleta como Solvente
    IF NEW.concept ILIKE '%Mensualidad%' AND NEW.status = 'Completado' THEN
        UPDATE athletes
        SET status = 'Solvente'
        WHERE id = NEW.athlete_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Ejecuta la función después de un INSERT o UPDATE en payments
CREATE TRIGGER trg_update_athlete_status
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_athlete_status_on_payment();

-- 4. Datos Semilla (Sandbox)

INSERT INTO teams (name, category) VALUES 
('Sirenitas', 'Infantil'),
('Auroras', 'Libre'),
('Valientes', 'Master');

-- Nota: Para insertar atletas y pagos, puedes hacerlo desde el dashboard de Supabase 
-- o vinculando el ID autogenerado de los equipos.
