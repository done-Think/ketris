import type { User } from '@server/auth/domain/user.entity'

export interface RenterParty {
  role: string
  email: string
  userId: string | null
}

export type RenterAccount = Pick<User, 'id' | 'email' | 'ativo' | 'papel'>
