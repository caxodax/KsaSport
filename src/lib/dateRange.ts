/**
 * Utilidades para manejo de rangos de fechas (Desde - Hasta) en KsaSport.
 */

export interface ParsedDateRange {
  startDate: Date;
  endDate: Date;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  formattedRange: string; // e.g. "01/09/2026 al 30/09/2026"
}

export function parseDateRange(params: {
  from?: string | string[] | null;
  to?: string | string[] | null;
  month?: string | string[] | null;
}): ParsedDateRange {
  const fromParam = typeof params.from === 'string' && params.from ? params.from : null;
  const toParam = typeof params.to === 'string' && params.to ? params.to : null;
  const monthParam = typeof params.month === 'string' && params.month ? params.month : null;

  const now = new Date();

  let startDate: Date;
  let endDate: Date;
  let from: string;
  let to: string;

  if (fromParam && toParam) {
    const [y1, m1, d1] = fromParam.split('-').map(n => parseInt(n, 10));
    const [y2, m2, d2] = toParam.split('-').map(n => parseInt(n, 10));

    startDate = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
    endDate = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
    from = fromParam;
    to = toParam;
  } else if (monthParam) {
    const [year, month] = monthParam.split('-').map(n => parseInt(n, 10));
    if (year && month) {
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
      from = `${year}-${String(month).padStart(2, '0')}-01`;
      to = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    } else {
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
      from = `${y}-${String(m).padStart(2, '0')}-01`;
      to = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    }
  } else {
    // Por defecto: Mes actual
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
    endDate = new Date(y, m, 0, 23, 59, 59, 999);
    from = `${y}-${String(m).padStart(2, '0')}-01`;
    to = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  }

  const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const dStart = new Intl.DateTimeFormat('es-VE', formatOptions).format(startDate);
  const dEnd = new Intl.DateTimeFormat('es-VE', formatOptions).format(endDate);
  const formattedRange = `${dStart} al ${dEnd}`;

  return {
    startDate,
    endDate,
    from,
    to,
    formattedRange
  };
}

