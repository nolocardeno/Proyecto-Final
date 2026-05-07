// --------------------------------------------------------------------------
// TESTS: calendar-export.utils
// --------------------------------------------------------------------------
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  downloadIcsFile,
} from './calendar-export.utils';

describe('calendar-export.utils', () => {
  const event = {
    title: 'Mi Documento',
    expiryDate: '2030-01-15',
  };

  it('buildGoogleCalendarUrl() incluye fechas y título correctamente', () => {
    const url = buildGoogleCalendarUrl(event);
    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Caduca%3A+Mi+Documento');
    expect(url).toContain('dates=20300115%2F20300116');
  });

  it('buildGoogleCalendarUrl() respeta una descripción personalizada', () => {
    const url = buildGoogleCalendarUrl({ ...event, description: 'desc' });
    expect(url).toContain('details=desc');
  });

  it('buildOutlookCalendarUrl() incluye startdt/enddt y allday=true', () => {
    const url = buildOutlookCalendarUrl(event);
    expect(url).toContain('https://outlook.live.com/calendar/0/deeplink/compose?');
    expect(url).toContain('startdt=2030-01-15');
    expect(url).toContain('enddt=2030-01-16');
    expect(url).toContain('allday=true');
  });

  it('buildOutlookCalendarUrl() respeta description personalizada', () => {
    const url = buildOutlookCalendarUrl({ ...event, description: 'mi-desc' });
    expect(url).toContain('body=mi-desc');
  });

  it('downloadIcsFile() crea un Blob, dispara la descarga y revoca el URL', () => {
    const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    const anchor = document.createElement('a');
    const clickSpy = spyOn(anchor, 'click');
    spyOn(document, 'createElement').and.returnValue(anchor);

    downloadIcsFile(event);

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
    expect(anchor.download).toContain('Mi_Documento_caducidad.ics');
  });
});
