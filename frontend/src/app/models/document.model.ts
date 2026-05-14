// --------------------------------------------------------------------------
// TIPOS DE DOCUMENTO (espejo del backend)
// --------------------------------------------------------------------------

/** Tipos de documento soportados por la aplicación. */
export type DocumentType =
  | 'DNI'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'INSURANCE'
  | 'ITV'
  | 'RECEIPT'
  | 'WARRANTY'
  | 'INVOICE'
  | 'OTHER';

/** Estado de un documento en relación a su fecha de caducidad. */
export type DocumentStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED';

// --------------------------------------------------------------------------
// RESPUESTA DEL BACKEND
// --------------------------------------------------------------------------

/**
 * Estructura de un documento devuelta por el backend.
 * Mantenida en sincronía con el DTO Java `DocumentResponse`.
 */
export interface DocumentResponse {
  id: number;
  type: DocumentType;
  title: string;
  category: string | null;
  storeName: string | null;
  amount: number | null;
  issueDate: string | null;
  expiryDate: string | null;
  daysRemaining: number | null;
  imagePath: string | null;
  aiProcessed: boolean;
  notes: string | null;
  status: DocumentStatus;
  duplicateOfId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos detectados por OCR/IA antes de crear el documento. El usuario los
 * revisa en el formulario del modal y confirma la creación.
 * Espejo del DTO Java `DocumentExtractionPreview`.
 */
export interface DocumentExtractionPreview {
  type: DocumentType;
  kind: 'ticket' | 'document';
  title: string;
  category: string | null;
  storeName: string | null;
  amount: number | null;
  issueDate: string | null;
  expiryDate: string | null;
  aiProcessed: boolean;
}

// --------------------------------------------------------------------------
// MAPA: DocumentType → card visual variant
// --------------------------------------------------------------------------

/** Asocia cada tipo de documento con su variante visual (ticket vs documento). */
const CARD_TYPE_MAP: Record<DocumentType, 'ticket' | 'document'> = {
  RECEIPT: 'ticket',
  WARRANTY: 'ticket',
  INVOICE: 'ticket',
  DNI: 'document',
  PASSPORT: 'document',
  DRIVING_LICENSE: 'document',
  INSURANCE: 'document',
  ITV: 'document',
  OTHER: 'document',
};

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------

/** Devuelve la variante visual ('ticket' | 'document') de un tipo de documento. */
export function getCardType(type: DocumentType): 'ticket' | 'document' {
  return CARD_TYPE_MAP[type];
}

/** Convierte una fecha ISO `YYYY-MM-DD` al formato local `DD-MM-YYYY`. */
export function formatDate(date: string | null): string {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
}

/** Genera el texto descriptivo del estado a partir de los días restantes. */
export function getStatusText(daysRemaining: number | null): string {
  if (daysRemaining === null) return 'Sin expiración';
  if (daysRemaining < 0) {
    return `Expirado hace ${Math.abs(daysRemaining)} día(s)`;
  }
  return `Expira en ${daysRemaining} día(s)`;
}
