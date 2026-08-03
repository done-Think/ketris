import type { User } from '../../domain/user.entity'

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
}
