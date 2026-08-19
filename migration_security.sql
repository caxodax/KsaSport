-- ==========================================
-- Migración: Seguridad Administrativa (Fase 6)
-- ==========================================

-- 1. Crear tabla de Roles Dinámicos
CREATE TABLE IF NOT EXISTS admin_roles (
    id VARCHAR(50) PRIMARY KEY, -- ej: 'superadmin', 'coach'
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb, -- Arreglo de permisos: ['view_roster', 'view_finances', 'manage_catalog', 'manage_settings']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar roles por defecto
INSERT INTO admin_roles (id, name, permissions) VALUES 
('superadmin', 'Súper Administrador', '["view_roster", "view_finances", "manage_catalog", "manage_settings", "manage_roles"]'::jsonb),
('coach', 'Entrenador Deportivo', '["view_roster"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 3. Crear tabla de Usuarios Administradores
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id VARCHAR(50) REFERENCES admin_roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTA PARA EL ADMINISTRADOR:
-- Después de ejecutar esto, debes insertar tu propia cuenta como SuperAdmin.
-- Puedes hacerlo en el SQL Editor o desde la interfaz de Supabase en la tabla admin_users.
-- Ejemplo:
-- INSERT INTO admin_users (id, email, role_id) VALUES ('TU-USER-ID-DE-AUTH', 'tu-email@ejemplo.com', 'superadmin');
