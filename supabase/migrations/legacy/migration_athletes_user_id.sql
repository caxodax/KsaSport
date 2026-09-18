-- ==========================================
-- Migración: Añadir Auth a Atletas
-- ==========================================

-- Añadir columna user_id para vincular la cuenta de Supabase Auth
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Añadir columna avatar_url para la foto de perfil
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

-- Opcional: Asegurar que el user_id sea único para que una cuenta de correo solo pueda estar ligada a un atleta
ALTER TABLE athletes ADD CONSTRAINT unique_user_id UNIQUE (user_id);
