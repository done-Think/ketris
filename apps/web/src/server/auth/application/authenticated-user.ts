import type { User } from '../domain/user.entity'
import type { AuthenticatedUser } from '../types/authenticated-user'

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    ...(user.phone !== undefined ? { phone: user.phone } : {}),
    ...(user.creci !== undefined ? { creci: user.creci } : {}),
    ...(user.cpf !== undefined ? { cpf: user.cpf } : {}),
    ...(user.tenantCnpj !== undefined ? { tenantCnpj: user.tenantCnpj } : {}),
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    active: user.active,
    membershipApprovedAt: user.membershipApprovedAt,
    ...(user.sessionVersion !== undefined ? { sessionVersion: user.sessionVersion } : {}),
  }
}
