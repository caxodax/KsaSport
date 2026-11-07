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

/**
 * Retorna la fecha y hora de corte exacta para un mes y día dados en hora de Venezuela (UTC-4).
 * Ejemplo: si cutoffDay = 6, retorna el día 6 a las 00:00:00 hora de Venezuela (04:00:00 UTC).
 */
export function getMorosidadCutoff(targetYear: number, targetMonth: number, cutoffDay: number): Date {
  const maxDays = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(1, cutoffDay || 5), maxDays);
  // En UTC, las 00:00:00 hora Venezuela (UTC-4) son las 04:00:00 UTC.
  return new Date(Date.UTC(targetYear, targetMonth - 1, safeDay, 4, 0, 0, 0));
}

/**
 * Determina si un pago o el momento actual califica como fuera de plazo / moroso según la hora de Venezuela.
 * Regla: Si el corte es el día 6, a partir del día 6 a las 00:00:00 hora Venezuela (minuto 1) aplica morosidad.
 * Pagos realizados el día 5 a las 23:59:59 o antes están a tiempo.
 * 
 * @param paymentDateInput Fecha del pago ('YYYY-MM-DD', timestamp ISO, Date, o null/undefined para evaluar 'ahora')
 * @param targetYear Año de la mensualidad (ej. 2026)
 * @param targetMonth Mes de la mensualidad (1 a 12, ej. 11 para Noviembre)
 * @param cutoffDay Día de corte configurado (ej. 6)
 */
export function isPaymentLate(
  paymentDateInput: string | Date | null | undefined,
  targetYear: number,
  targetMonth: number,
  cutoffDay: number
): boolean {
  const deadlineUtc = getMorosidadCutoff(targetYear, targetMonth, cutoffDay);

  // Si no se especifica fecha de pago, se evalúa el momento presente (ahora)
  if (!paymentDateInput) {
    return new Date().getTime() >= deadlineUtc.getTime();
  }

  // Si se ingresa como string de fecha calendario simple ("YYYY-MM-DD")
  if (typeof paymentDateInput === 'string') {
    const trimmed = paymentDateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [pY, pM, pD] = trimmed.split('-').map(Number);
      if (pY > targetYear) return true;
      if (pY < targetYear) return false;
      if (pM > targetMonth) return true;
      if (pM < targetMonth) return false;
      
      const maxDays = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
      const safeDay = Math.min(Math.max(1, cutoffDay || 5), maxDays);
      return pD >= safeDay;
    }
  }

  // Si es un Date o timestamp ISO (ej. '2026-11-06T04:01:00Z' de created_at)
  const pDate = new Date(paymentDateInput);
  if (isNaN(pDate.getTime())) {
    return new Date().getTime() >= deadlineUtc.getTime();
  }

  return pDate.getTime() >= deadlineUtc.getTime();
}

