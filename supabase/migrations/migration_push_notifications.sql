-- ==============================================================================
-- MIGRACIÓN: SISTEMA DE NOTIFICACIONES PUSH NATIVAS PWA (WEB PUSH / VAPID)
-- KASA SPORTS
-- ==============================================================================

-- 1. Tabla de Suscripciones Push de Dispositivos (Navegadores Móviles / Escritorio)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para búsqueda ultra rápida por usuario, atleta o endpoint
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_athlete_id ON public.push_subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);

-- 2. Tabla de Historial y Bitácora de Notificaciones Enviadas desde el Admin
CREATE TABLE IF NOT EXISTS public.push_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT DEFAULT '/portal',
    target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'team', 'status', 'athlete'
    target_filter TEXT,                     -- ID o valor del filtro (ej. ID de equipo, 'Solvente', etc.)
    sent_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,                        -- Email del administrador que envió
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_push_log_created_at ON public.push_notifications_log(created_at DESC);

-- 3. Políticas de Seguridad RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados insertar o renovar su propia suscripción
CREATE POLICY "Permitir a usuarios gestionar sus suscripciones push"
    ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Permitir a usuarios anónimos suscribirse si lo desean
CREATE POLICY "Permitir a usuarios anonimos registrar suscripcion"
    ON public.push_subscriptions
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Las consultas directas y envíos de broadcast se realizan vía Service Role Supabase en el servidor.
