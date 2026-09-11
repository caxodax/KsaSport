-- ==========================================================
-- KsaSports - Migración de Optimización de Índices de Base de Datos
-- Para Alta Concurrencia (200+ Usuarios Simultáneos)
-- ==========================================================

-- 1. Índices en la tabla de Atletas (athletes)
-- Acelera drásticamente el filtrado por equipo, estatus y ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_athletes_team_id ON athletes(team_id);
CREATE INDEX IF NOT EXISTS idx_athletes_status ON athletes(status);
CREATE INDEX IF NOT EXISTS idx_athletes_created_at ON athletes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_athletes_team_status ON athletes(team_id, status);
CREATE INDEX IF NOT EXISTS idx_athletes_name ON athletes(name);
CREATE INDEX IF NOT EXISTS idx_athletes_paid_until ON athletes(paid_until);

-- 2. Índices en la tabla de Staff Técnico (staff)
-- Acelera la verificación de rol y equipo del entrenador autenticado
CREATE INDEX IF NOT EXISTS idx_staff_team_id ON staff(team_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- 3. Índices en la tabla de Pagos (payments)
-- Acelera los reportes de Libro Mayor, Dashboard y bandeja de pagos
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_athlete_id ON payments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_payments_product_id ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);

-- 4. Índices en Roles Administrativos (admin_users)
-- Acelera la verificación de permisos por usuario
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);

