-- Agregamos la columna a los productos para indicar que requieren confirmación de participación
ALTER TABLE products
ADD COLUMN IF NOT EXISTS requires_opt_in BOOLEAN DEFAULT false;

-- Creamos la tabla de inscripciones
CREATE TABLE IF NOT EXISTS athlete_product_opt_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un atleta solo puede inscribirse una vez al mismo producto
    UNIQUE(athlete_id, product_id)
);

-- Políticas de seguridad básica para la nueva tabla
ALTER TABLE athlete_product_opt_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on opt_ins"
ON athlete_product_opt_ins
FOR ALL
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Athletes can view their own opt_ins"
ON athlete_product_opt_ins
FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Athletes can insert their own opt_ins"
ON athlete_product_opt_ins
FOR INSERT
WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));
