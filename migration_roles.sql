-- ==========================================================
-- KsaSports - Migración de Roles Intermedios Administrativos
-- ==========================================================

INSERT INTO admin_roles (id, name, permissions) VALUES 
('treasurer', 'Tesorero / Finanzas', '["view_roster", "view_finances"]'::jsonb),
('coordinator', 'Coordinador Deportivo', '["view_roster", "manage_catalog"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    permissions = EXCLUDED.permissions;

