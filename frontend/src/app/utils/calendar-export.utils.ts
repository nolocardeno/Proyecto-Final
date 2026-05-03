// --------------------------------------------------------------------------
// CALENDAR EXPORT HELPERS
// --------------------------------------------------------------------------
// Conjunto de funciones puras que generan enlaces (Google / Outlook) y
// archivos ICS para añadir un recordatorio de caducidad de un documento
// al calendario del usuario. Hace uso intensivo de los objetos predefinidos
// del lenguaje y del navegador (`Date`, `URLSearchParams`, `Blob`,
// `URL.createObjectURL`, `document.createElement`).
// --------------------------------------------------------------------------

/** Datos mínimos para construir un evento de calendario. */
export interface CalendarEventData {
  /** Título del evento (mostrado al usuario en el calendario). */
  title: string;
  /** Fecha de caducidad en formato ISO (YYYY-MM-DD). */
  expiryDate: string;
  /** Descripción opcional; si se omite se genera una por defecto. */
  description?: string;
}

// --------------------------------------------------------------------------
// FORMAT HELPERS
// --------------------------------------------------------------------------

/** Convierte una fecha ISO `YYYY-MM-DD` al formato compacto `YYYYMMDD`. */
function toCompactDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/**
 * Devuelve la fecha siguiente a la indicada en formato compacto.
 * Necesario porque los eventos de día completo en ICS / Google Calendar
 * usan un rango exclusivo donde `DTEND` es el día posterior al evento.
 */
function toCompactDateNextDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const next = new Date(year, month - 1, day + 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// --------------------------------------------------------------------------
// GOOGLE CALENDAR
// --------------------------------------------------------------------------

/**
 * Construye una URL de Google Calendar con los parámetros del evento
 * codificados mediante `URLSearchParams`.
 */
export function buildGoogleCalendarUrl(event: CalendarEventData): string {
  const start = toCompactDate(event.expiryDate);
  const end = toCompactDateNextDay(event.expiryDate);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Caduca: ${event.title}`,
    dates: `${start}/${end}`,
    details: event.description ?? `El documento "${event.title}" caduca el ${event.expiryDate}.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --------------------------------------------------------------------------
// OUTLOOK (Live) WEB
// --------------------------------------------------------------------------

/** Construye una URL de Outlook.com con los parámetros del evento. */
export function buildOutlookCalendarUrl(event: CalendarEventData): string {
  const [year, month, day] = event.expiryDate.split('-').map(Number);
  const nextDay = new Date(year, month - 1, day + 1);
  const endDate = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    subject: `Caduca: ${event.title}`,
    startdt: event.expiryDate,
    enddt: endDate,
    allday: 'true',
    body: event.description ?? `El documento "${event.title}" caduca el ${event.expiryDate}.`,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// --------------------------------------------------------------------------
// ICS FILE DOWNLOAD
// --------------------------------------------------------------------------

/**
 * Genera un archivo ICS válido y dispara su descarga.
 *
 * Demuestra varios objetos predefinidos del lenguaje y del navegador:
 *  - `Blob` para construir el archivo en memoria.
 *  - `URL.createObjectURL` / `URL.revokeObjectURL` para gestionar la URL.
 *  - `document.createElement('a')` y `.click()` para crear dinámicamente
 *    un enlace en el DOM y simular el click que inicia la descarga.
 */
export function downloadIcsFile(event: CalendarEventData): void {
  const start = toCompactDate(event.expiryDate);
  const end = toCompactDateNextDay(event.expiryDate);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const uid = `scantral-${Date.now()}@scantral.app`;

  // Construcción del cuerpo del archivo ICS línea a línea (RFC 5545).
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Scantral//Document Expiry//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `DTSTAMP:${now}Z`,
    `UID:${uid}`,
    `SUMMARY:Caduca: ${event.title}`,
    `DESCRIPTION:${(event.description ?? `El documento "${event.title}" caduca el ${event.expiryDate}.`).replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Empaqueta el contenido en un Blob y crea un enlace temporal en el DOM
  // para forzar la descarga del archivo en el navegador.
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${event.title.replace(/\s+/g, '_')}_caducidad.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
