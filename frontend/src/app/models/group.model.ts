// --------------------------------------------------------------------------
// TIPOS DE GRUPO (espejo del backend)
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// RESPUESTA DEL BACKEND
// --------------------------------------------------------------------------
export interface GroupResponse {
  id: number;
  name: string;
  creatorId: number;
  allCanAddDocuments: boolean;
  memberCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// PETICIÓN DE CREACIÓN
// --------------------------------------------------------------------------
export interface GroupRequest {
  name: string;
  allCanAddDocuments: boolean;
}
