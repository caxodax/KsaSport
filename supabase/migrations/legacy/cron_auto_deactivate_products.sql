-- ==========================================
-- Tarea Programada: Auto-Desactivación de Productos Vencidos
-- ==========================================
-- Requiere habilitar la extensión pg_cron en Supabase.
-- En tu dashboard de Supabase ve a Database -> Extensions y busca "pg_cron".

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Esta tarea se ejecutará todos los días a la medianoche (00:00).
-- Comprueba los productos activos cuya fecha de finalización ya pasó y los inactiva.

SELECT cron.schedule(
  'auto-deactivate-expired-products', 
  '0 0 * * *', 
  $$
    UPDATE public.products
    SET is_active = false
    WHERE is_active = true 
      AND end_date IS NOT NULL 
      AND end_date < NOW();
  $$
);

-- Si en el futuro necesitas desactivar/eliminar esta tarea cron, corre:
-- SELECT cron.unschedule('auto-deactivate-expired-products');

