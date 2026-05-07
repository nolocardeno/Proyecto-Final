// --------------------------------------------------------------------------
// TESTS: document.model helpers
// --------------------------------------------------------------------------
import { formatDate, getCardType, getStatusText } from './document.model';

describe('document.model helpers', () => {
  it('getCardType() mapea correctamente tickets vs documentos', () => {
    expect(getCardType('RECEIPT')).toBe('ticket');
    expect(getCardType('WARRANTY')).toBe('ticket');
    expect(getCardType('INVOICE')).toBe('ticket');
    expect(getCardType('DNI')).toBe('document');
    expect(getCardType('PASSPORT')).toBe('document');
    expect(getCardType('DRIVING_LICENSE')).toBe('document');
    expect(getCardType('INSURANCE')).toBe('document');
    expect(getCardType('ITV')).toBe('document');
    expect(getCardType('OTHER')).toBe('document');
  });

  it('formatDate() devuelve guion largo para nulo', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formatDate() invierte el formato ISO', () => {
    expect(formatDate('2030-12-05')).toBe('05-12-2030');
  });

  it('getStatusText() reporta sin expiración / expirado / por expirar', () => {
    expect(getStatusText(null)).toBe('Sin expiración');
    expect(getStatusText(-3)).toBe('Expirado hace 3 día(s)');
    expect(getStatusText(0)).toBe('Expira en 0 día(s)');
    expect(getStatusText(7)).toBe('Expira en 7 día(s)');
  });
});
