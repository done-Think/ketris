import type { Papel, User } from '../../domain/user.entity'

export interface NewUser {
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: Papel
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByEmailAndTenant(tenantId: string, email: string): Promise<User | null>
  create(user: NewUser): Promise<User>
}
