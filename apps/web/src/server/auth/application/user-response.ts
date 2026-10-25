import type { AuthenticatedUser } from '../domain/user.entity'
import type { AuthenticatedUserResponse } from '../types/user-response'

export function toAuthenticatedUserResponse(user: AuthenticatedUser): AuthenticatedUserResponse {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.nome,
    email: user.email,
    phone: user.telefone ?? null,
    creci: user.creci ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.papel,
    active: user.ativo,
    pendingApproval: user.vinculoAprovadoEm === null,
  }
}
