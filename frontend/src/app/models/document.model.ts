// --------------------------------------------------------------------------
// TIPOS DE DOCUMENTO (espejo del backend)
// --------------------------------------------------------------------------

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

export type DocumentStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED';

// --------------------------------------------------------------------------
// RESPUESTA DEL BACKEND
// --------------------------------------------------------------------------
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

// --------------------------------------------------------------------------
// MAPA: DocumentType → card visual variant
// --------------------------------------------------------------------------
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
export function getCardType(type: DocumentType): 'ticket' | 'document' {
  return CARD_TYPE_MAP[type];
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
}

export function getStatusText(daysRemaining: number | null): string {
  if (daysRemaining === null) return 'Sin expiración';
  if (daysRemaining < 0) {
    return `Expirado hace ${Math.abs(daysRemaining)} día(s)`;
  }
  return `Expira en ${daysRemaining} día(s)`;
}
