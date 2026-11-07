import { SupabaseClient } from '@supabase/supabase-js';
import { isPaymentLate } from '@/lib/dateUtils';

/**
 * Obtiene el último día del mes cubierto por un producto de mensualidad (formato YYYY-MM-DD).
 * Ej: "Mensualidad Krown Noviembre" con start_date "2026-11-01" -> "2026-11-30"
 */
export function getProductCoveredMonth(prod: { name?: string; start_date?: string | null }): string | null {
  let year: number | null = null;
  let month: number | null = null;

  if (prod.start_date) {
    const parts = prod.start_date.split('T')[0].split('-').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      year = parts[0];
      month = parts[1];
    }
  }

  if (!month && prod.name) {
    const nameLower = prod.name.toLowerCase();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const foundIdx = months.findIndex(m => nameLower.includes(m));
    if (foundIdx !== -1) {
      month = foundIdx + 1;
      year = new Date().getFullYear();
    }
  }

  if (year && month) {
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mStr = month.toString().padStart(2, '0');
    const dStr = lastDay.toString().padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  }
  return null;
}

/**
 * Sincroniza la cobertura financiera (`paid_until`) y el estatus deportivo (`Solvente` | `Moroso`)
 * de una atleta en función de sus pagos completados y de sus exoneraciones activas de mensualidad.
 * Respeta atletas con estatus 'Inactivo'.
 */
export async function syncAthleteCoverage(athleteId: string, supabase: SupabaseClient) {
  // 1. Obtener la atleta y su equipo
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name, status, paid_until, has_alliance, teams(category)')
    .eq('id', athleteId)
    .single();

  if (!athlete) return null;

  // Si está Inactiva, no alterar su estatus deportivo
  if (athlete.status === 'Inactivo') {
    return { status: 'Inactivo', paid_until: athlete.paid_until };
  }

  // 2. Obtener exoneraciones activas
  const { data: exemptions } = await supabase
    .from('athlete_exemptions')
    .select('product_id, products(id, name, start_date, end_date, price)')
    .eq('athlete_id', athleteId);

  // 3. Obtener pagos completados de mensualidad
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, product_id, created_at, products(id, name, start_date, end_date, price)')
    .eq('athlete_id', athleteId)
    .eq('status', 'Completado');

  // 4. Reglas de corte / gracia
  const { data: settings } = await supabase
    .from('club_settings')
    .select('grace_period_days')
    .eq('id', 1)
    .maybeSingle();

  const defaultGrace = settings?.grace_period_days ?? 5;
  const categoryName = (athlete.teams as any)?.category;
  let effGrace = defaultGrace;

  if (categoryName) {
    const { data: cat } = await supabase
      .from('categories')
      .select('grace_period_days')
      .ilike('name', categoryName.trim())
      .maybeSingle();

    if (cat?.grace_period_days) effGrace = cat.grace_period_days;
  }

  // 5. Recolectar fechas cubiertas (por exoneración o por pago completo de la cuota)
  const coveredDates: string[] = [];

  (exemptions || []).forEach(e => {
    const prod = Array.isArray(e.products) ? e.products[0] : e.products;
    if (prod && (prod.name.toLowerCase().includes('mensualidad') || prod.name.toLowerCase().includes('cuota'))) {
      const cov = getProductCoveredMonth(prod);
      if (cov) coveredDates.push(cov);
    }
  });

  (payments || []).forEach(p => {
    const prod = Array.isArray(p.products) ? p.products[0] : p.products;
    if (prod && (prod.name.toLowerCase().includes('mensualidad') || prod.name.toLowerCase().includes('cuota'))) {
      const cov = getProductCoveredMonth(prod);
      if (cov && Number(p.amount) >= Number(prod.price || 0)) {
        coveredDates.push(cov);
      }
    }
  });

  // 6. Fecha más alta cubierta
  let highestCoveredDate: string | null = null;
  for (const d of coveredDates) {
    if (!highestCoveredDate || d > highestCoveredDate) {
      highestCoveredDate = d;
    }
  }

  // 7. Evaluar solvencia
  let newStatus: 'Solvente' | 'Moroso' = 'Moroso';
  let newPaidUntil: string | null = highestCoveredDate;

  if (highestCoveredDate) {
    const [y, m] = highestCoveredDate.split('-').map(Number);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (y > curYear || (y === curYear && m >= curMonth)) {
      // Cobertura cubre el mes en curso o futuro
      newStatus = 'Solvente';
    } else {
      // Cobertura vencida en meses pasados -> verificar si venció el día de corte del mes siguiente
      const nextMonthYear = m === 12 ? y + 1 : y;
      const nextMonth = m === 12 ? 1 : m + 1;
      const isLate = isPaymentLate(null, nextMonthYear, nextMonth, effGrace);
      newStatus = isLate ? 'Moroso' : 'Solvente';
    }
  } else {
    // Si la atleta no tiene pagos de mensualidad ni exoneraciones registradas
    newPaidUntil = null;
    newStatus = 'Moroso';
  }

  // 8. Actualizar solo si hay cambios reales en la base de datos
  if (athlete.status !== newStatus || athlete.paid_until !== newPaidUntil) {
    await supabase
      .from('athletes')
      .update({
        status: newStatus,
        paid_until: newPaidUntil
      })
      .eq('id', athleteId);
  }

  return { status: newStatus, paid_until: newPaidUntil };
}
