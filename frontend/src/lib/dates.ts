import {
  format,
  formatRelative as fnsFormatRelative,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

const locale = es;

/**
 * Parse an ISO string or return the Date as-is.
 */
export function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/**
 * Relative description: "hace 5 minutos", "mañana a las 10:00", etc.
 */
export function formatRelative(value: string | Date): string {
  return fnsFormatRelative(toDate(value), new Date(), { locale });
}

/**
 * Readable date: "15 de marzo de 2026"
 */
export function formatDate(value: string | Date): string {
  return format(toDate(value), "d 'de' MMMM 'de' yyyy", { locale });
}

/**
 * Short date: "15/03/2026"
 */
export function formatDateShort(value: string | Date): string {
  return format(toDate(value), "dd/MM/yyyy", { locale });
}

/**
 * Time only: "10:30"
 */
export function formatTime(value: string | Date): string {
  return format(toDate(value), "HH:mm", { locale });
}

/**
 * Full date + time: "15 mar 2026 10:30"
 */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "d MMM yyyy HH:mm", { locale });
}

/**
 * Human-friendly distance: "hace 3 horas"
 */
export function formatTimeAgo(value: string | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true, locale });
}

/**
 * True when the date is strictly in the past.
 */
export function isOverdue(value: string | Date): boolean {
  return isBefore(toDate(value), new Date());
}

/**
 * True when the date is strictly in the future.
 */
export function isFuture(value: string | Date): boolean {
  return isAfter(toDate(value), new Date());
}

export { isToday, isTomorrow, isYesterday, isSameDay, parseISO };
