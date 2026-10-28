import type { User } from '../domain/user.entity'

export type AuthenticatedUser = Omit<User, 'passwordHash'>
