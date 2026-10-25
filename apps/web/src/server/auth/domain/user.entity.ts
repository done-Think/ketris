import type { UserAccessState } from '../types/user-access'

export type Papel = 'OWNER' | 'AGENT' | 'RENTER' | 'PROPERTY_OWNER'

export type TenantMemberPapel = Exclude<Papel, 'RENTER'>

export interface User extends UserAccessState {
  id: string
  tenantId: string
  nome: string
  email: string
  telefone?: string | null
  creci?: string | null
  senhaHash: string
  avatarUrl?: string | null
  papel: Papel
  ativo: boolean
  vinculoAprovadoEm: Date | null
}

export type AuthenticatedUser = Omit<User, 'senhaHash'>

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    nome: user.nome,
    email: user.email,
    ...(user.telefone !== undefined ? { telefone: user.telefone } : {}),
    ...(user.creci !== undefined ? { creci: user.creci } : {}),
    avatarUrl: user.avatarUrl ?? null,
    papel: user.papel,
    ativo: user.ativo,
    vinculoAprovadoEm: user.vinculoAprovadoEm,
    ...(user.sessionVersion !== undefined ? { sessionVersion: user.sessionVersion } : {}),
  }
}
