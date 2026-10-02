/**
 * Utilidades centralizadas de formateo de fechas para KsaSport.
 * 
 * Resuelve el bug de desfase de zona horaria (Punto 2.4 de Auditoría):
 * Cuando un campo fecha ("YYYY-MM-DD") se parsea directamente con new Date("YYYY-MM-DD"),
 * JavaScript asume medianoche UTC (00:00:00Z). En husos horarios occidentales como
 * Venezuela (UTC-4), esto traslada la fecha 4 horas hacia atrás (20:00 hrs del día previo),
 * mostrando que una mensualidad vence el 30 en lugar del 31.
 */

/**
 * Formatea una fecha de calendario o timestamp asegurando consistencia de huso horario.
 * Para fechas sin hora ("YYYY-MM-DD" o "YYYY-MM-DDT00:00:00"), utiliza UTC al mediodía (12:00:00Z)
 * con timeZone: 'UTC', garantizando que el día calendario permanezca inmutable en cualquier
 * navegador y latitud.
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'es-VE'
): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    return dateInput.toLocaleDateString(locale, options || {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // Detecta si es una fecha tipo calendario: YYYY-MM-DD o con medianoche UTC
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?(Z|[+-]\d{2}:\d{2})?)?$/.test(str);

  if (isCalendarDate) {
    const cleanDate = str.split('T')[0];
    const parts = cleanDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const [year, month, day] = parts;
      const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return utcDate.toLocaleDateString(locale, {
        timeZone: 'UTC',
        day: options?.day ?? 'numeric',
        month: options?.month ?? 'long',
        year: options?.year ?? 'numeric',
        ...options
      });
    }
  }

  // Si contiene hora real (timestamp de creación o auditoría)
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return str;

  return parsed.toLocaleDateString(locale, options || {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formato corto tipo DD/MM/AAAA para tablas, listas y badges compactos.
 */
export function formatLocalDateShort(
  dateInput: string | Date | null | undefined,
  locale: string = 'es-VE'
): string {
  return formatLocalDate(dateInput, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }, locale);
}

/**
 * Formatea un rango de fechas de producto ("01 oct — 31 oct 2026")
 */
export function formatDateRangeText(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined,
  locale: string = 'es-VE'
): string {
  if (!startDateStr || !endDateStr) return '';
  const start = formatLocalDate(startDateStr, { day: '2-digit', month: 'short' }, locale);
  const end = formatLocalDate(endDateStr, { day: '2-digit', month: 'short', year: 'numeric' }, locale);
  return `${start} — ${end}`;
}
