import { format, parseISO } from "date-fns";

/**
 * Las fechas de las entidades llegan como "2026-10-31" (sin hora).
 * new Date("2026-10-31") las interpreta como UTC, y en México (UTC-6) se mostraban un día antes.
 * parseISO las interpreta en la zona horaria local.
 */
export function parseDateOnly(value) {
  if (!value) return null;
  const date = parseISO(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "dd/MM/yyyy" o "—" si no hay fecha válida. */
export function formatDate(value, pattern = "dd/MM/yyyy") {
  const date = parseDateOnly(value);
  return date ? format(date, pattern) : "—";
}

/**
 * Fecha de hoy como "yyyy-MM-dd" en hora LOCAL.
 * new Date().toISOString() da la fecha en UTC: en México, después de las 18:00 ya es "mañana".
 */
export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}
