-- Agregar flag visual de alianza a la tabla de atletas
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS has_alliance BOOLEAN DEFAULT false;

-- Crear tabla de exoneraciones por producto (qué productos le salen gratis al atleta)
CREATE TABLE IF NOT EXISTS athlete_exemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un atleta solo puede estar exonerado de un mismo producto una vez
    UNIQUE(athlete_id, product_id)
);

-- Políticas de seguridad para la tabla de exoneraciones
ALTER TABLE athlete_exemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on exemptions"
ON athlete_exemptions
FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Athletes can view their own exemptions"
ON athlete_exemptions
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));
