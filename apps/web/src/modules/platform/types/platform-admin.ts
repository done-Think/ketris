export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export interface PlatformAdminAccount {
  id: string
  nome: string
  email: string
  role: PlatformAdminRole
  ativo: boolean
}

export interface CreatePlatformAdminPayload {
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}

export interface UpdatePlatformAdminPayload {
  nome: string
  email: string
  role: PlatformAdminRole
}

export interface PlatformAdminResponse {
  admin: PlatformAdminAccount
}

export interface ListPlatformAdminsResponse {
  admins: PlatformAdminAccount[]
}

export interface CreatePlatformAdminInput {
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}
