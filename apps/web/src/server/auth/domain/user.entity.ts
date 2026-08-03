// Entidade de domínio — nunca é o mesmo tipo do model Prisma (que é detalhe de infraestrutura).
// `senhaHash` fica presente aqui porque quem decide comparar a senha é o use-case (domínio), não a
// infraestrutura; mas nenhuma resposta HTTP deve serializar este tipo diretamente (ver AuthenticatedUser).

export type Papel = 'ADMIN' | 'PROPRIETARIO' | 'CORRETOR'

export interface User {
  id: string
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: Papel
}

// Forma pública/segura do usuário — o que pode sair em uma resposta HTTP (sem senhaHash).
export type AuthenticatedUser = Omit<User, 'senhaHash'>

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- descarte proposital do hash
  const { senhaHash: _senhaHash, ...safe } = user
  return safe
}
