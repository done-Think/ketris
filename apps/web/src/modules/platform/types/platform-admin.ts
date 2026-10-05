export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export interface PlatformAdminAccount {
  id: string
  nome: string
  email: string
  role: PlatformAdminRole
  ativo: boolean
}
