import type { PlatformAdminRole } from './platform-admin'

export interface NewPlatformAdmin {
  nome: string
  email: string
  senhaHash: string
  role: PlatformAdminRole
}

export interface PlatformAdminUpdate {
  nome?: string
  email?: string
  role?: PlatformAdminRole
  ativo?: true
}
