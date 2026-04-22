// --------------------------------------------------------------------------
// CALENDAR EXPORT HELPERS
// Generates calendar links and ICS files for document expiry events.
// --------------------------------------------------------------------------

export interface CalendarEventData {
  title: string;
  expiryDate: string; // ISO format: YYYY-MM-DD
  description?: string;
}

// --------------------------------------------------------------------------
// FORMAT HELPERS
// --------------------------------------------------------------------------

/** Converts ISO date YYYY-MM-DD to Google/ICS compact form YYYYMMDD */
function toCompactDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/** Converts ISO date YYYY-MM-DD to Date then adds 1 day, returns compact form */
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
export function downloadIcsFile(event: CalendarEventData): void {
  const start = toCompactDate(event.expiryDate);
  const end = toCompactDateNextDay(event.expiryDate);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const uid = `scantral-${Date.now()}@scantral.app`;

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

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${event.title.replace(/\s+/g, '_')}_caducidad.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
