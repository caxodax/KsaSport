-- ==========================================
-- Migración: Comprobantes de Pago (Fase 4)
-- ==========================================

-- Agregar columna para almacenar la URL pública de la imagen del comprobante (Cloudflare R2)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Opcional: Agregar columna para la foto de perfil en la tabla athletes si no existía de la Fase 2
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS avatar_url TEXT;
