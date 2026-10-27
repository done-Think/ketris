export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export interface PlatformAdmin {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: PlatformAdminRole
  ativo: boolean
  createdAt: Date
  ultimoAcessoEm: Date | null
}

export type AuthenticatedPlatformAdmin = Omit<PlatformAdmin, 'senhaHash'>

export type PlatformAdminIdentity = Pick<PlatformAdmin, 'id' | 'nome' | 'email' | 'role' | 'ativo'>

export interface AuthenticatedPlatformAdminResponse {
  id: string
  name: string
  email: string
  role: PlatformAdminRole
  active: boolean
  createdAt: string
  lastAccessAt: string | null
}
