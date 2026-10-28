import type { AuthenticatedUser } from '../types/authenticated-user'
import type { AuthenticatedUserResponse } from '../types/user-response'

export function toAuthenticatedUserResponse(user: AuthenticatedUser): AuthenticatedUserResponse {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    creci: user.creci ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    active: user.active,
    pendingApproval: user.membershipApprovedAt === null,
  }
}
