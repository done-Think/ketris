export type Papel = 'ADMIN' | 'PROPRIETARIO' | 'CORRETOR'

export interface User {
  id: string
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: Papel
}

export type AuthenticatedUser = Omit<User, 'senhaHash'>

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
  }
}
