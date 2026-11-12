/**
 * Utilidades para manejo de rangos de fechas (Desde - Hasta) en KsaSport.
 */

export interface ParsedDateRange {
  startDate: Date;
  endDate: Date;
  timestampStartIso: string; // Inicio del día en Venezuela (00:00:00.000-04:00) en UTC ISO
  timestampEndIso: string;   // Fin del día en Venezuela (23:59:59.999-04:00) en UTC ISO
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  formattedRange: string; // e.g. "01/09/2026 al 30/09/2026"
}

function getCurrentVzlaYearMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === 'year')?.value) || new Date().getUTCFullYear();
  const month = Number(parts.find((p) => p.type === 'month')?.value) || (new Date().getUTCMonth() + 1);
  return { year, month };
}

function formatYmdToVe(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function parseDateRange(params: {
  from?: string | string[] | null;
  to?: string | string[] | null;
  month?: string | string[] | null;
}): ParsedDateRange {
  const fromParam = typeof params.from === 'string' && params.from ? params.from : null;
  const toParam = typeof params.to === 'string' && params.to ? params.to : null;
  const monthParam = typeof params.month === 'string' && params.month ? params.month : null;

  let y1: number, m1: number, d1: number;
  let y2: number, m2: number, d2: number;

  if (fromParam && toParam) {
    [y1, m1, d1] = fromParam.split('-').map(n => parseInt(n, 10));
    [y2, m2, d2] = toParam.split('-').map(n => parseInt(n, 10));
  } else {
    const [parsedYear, parsedMonth] = monthParam ? monthParam.split('-').map(n => parseInt(n, 10)) : [NaN, NaN];
    const vzla = (!parsedYear || !parsedMonth) ? getCurrentVzlaYearMonth() : null;
    const year = parsedYear || vzla!.year;
    const month = parsedMonth || vzla!.month;

    y1 = y2 = year;
    m1 = m2 = month;
    d1 = 1;
    d2 = new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  const startDate = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
  const endDate = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
  const from = `${y1}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
  const to = `${y2}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;

  // Límites exactos en hora oficial de Venezuela (UTC-4 fijo): 00:00:00 Vzla = 04:00:00 UTC
  const timestampStartIso = new Date(Date.UTC(y1, m1 - 1, d1, 4, 0, 0, 0)).toISOString();
  const timestampEndIso = new Date(Date.UTC(y2, m2 - 1, d2 + 1, 3, 59, 59, 999)).toISOString();
  const formattedRange = `${formatYmdToVe(from)} al ${formatYmdToVe(to)}`;

  return {
    startDate,
    endDate,
    timestampStartIso,
    timestampEndIso,
    from,
    to,
    formattedRange
  };
}

