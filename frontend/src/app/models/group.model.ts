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
// DETALLE DEL GRUPO (incluye código de acceso y miembros)
// --------------------------------------------------------------------------
export interface GroupDetailResponse {
  id: number;
  name: string;
  description: string | null;
  creatorId: number;
  accessCode: string;
  allCanAddDocuments: boolean;
  memberCount: number;
  documentCount: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// MIEMBRO DEL GRUPO
// --------------------------------------------------------------------------
export interface GroupMember {
  userId: number;
  name: string;
  profileImagePath: string | null;
}

// --------------------------------------------------------------------------
// PETICIÓN DE CREACIÓN
// --------------------------------------------------------------------------
export interface GroupRequest {
  name: string;
  allCanAddDocuments: boolean;
}
