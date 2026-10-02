-- ==============================================================================
-- KASA SPORTS: FUNCIONES ATÓMICAS Y CONTROL DE CONCURRENCIA FINANCIERA (Puntos 2.1 y 2.2)
-- ==============================================================================

-- Función atómica para incrementar o reducir el saldo de cantina evitando Race Conditions
CREATE OR REPLACE FUNCTION public.increment_food_balance(p_athlete_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Garantizar que la cuenta de crédito exista
  INSERT INTO public.food_credit_accounts (athlete_id, balance, credit_limit, updated_at)
  VALUES (p_athlete_id, 0.00, 50.00, NOW())
  ON CONFLICT (athlete_id) DO NOTHING;

  -- Actualización atómica con bloqueo a nivel de fila en Postgres
  UPDATE public.food_credit_accounts
  SET balance = GREATEST(0, ROUND((balance + p_amount)::numeric, 2)),
      updated_at = NOW()
  WHERE athlete_id = p_athlete_id
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
