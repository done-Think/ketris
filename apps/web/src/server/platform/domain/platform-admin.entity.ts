export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export interface PlatformAdmin {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: PlatformAdminRole
  ativo: boolean
}

export type AuthenticatedPlatformAdmin = Omit<PlatformAdmin, 'senhaHash'>

export function toAuthenticatedPlatformAdmin(admin: PlatformAdmin): AuthenticatedPlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    role: admin.role,
    ativo: admin.ativo,
  }
}
