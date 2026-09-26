export type Papel = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export type NonAdminPapel = Exclude<Papel, 'ADMIN' | 'RENTER'>

export interface User {
  id: string
  tenantId: string
  nome: string
  email: string
  senhaHash: string
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
    papel: user.papel,
    ativo: user.ativo,
    vinculoAprovadoEm: user.vinculoAprovadoEm,
  }
}

export type AuthenticatedUserResponse = {
  id: string
  tenantId: string
  name: string
  email: string
  role: Papel
  active: boolean
  pendingApproval: boolean
}

export function toAuthenticatedUserResponse(user: AuthenticatedUser): AuthenticatedUserResponse {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.nome,
    email: user.email,
    role: user.papel,
    active: user.ativo,
    pendingApproval: user.vinculoAprovadoEm === null,
  }
}
