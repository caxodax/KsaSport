/**
 * Utilidades para el manejo, formateo y sanitización de Cédulas de Identidad (C.I.).
 * - Visualmente se presentan con separador de miles con puntos: '26.540.705'
 * - En la base de datos se guardan estrictamente sin puntos ni caracteres especiales: '26540705'
 */

/**
 * Remueve cualquier caracter que no sea dígito numérico.
 * Ejemplo: "26.540.705" -> "26540705", "V-26.540.705" -> "26540705"
 */
export function cleanCedula(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '').trim();
}

/**
 * Formatea una cédula numérica agregándole puntos de miles.
 * Ejemplo: "26540705" -> "26.540.705", 26540705 -> "26.540.705"
 */
export function formatCedula(val: string | number | null | undefined): string {
  const clean = cleanCedula(val);
  if (!clean) return '';
  // Aplica expresión regular de separador de miles
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Enmascara y formatea el valor de un input en tiempo real mientras el usuario escribe o pega.
 * Limita a un máximo de 10 dígitos (adecuado para cédulas venezolanas y latinoamericanas).
 */
export function maskCedulaInput(raw: string, maxDigits: number = 10): string {
  const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

