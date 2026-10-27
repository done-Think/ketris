import type {
  AuthenticatedPlatformAdmin,
  AuthenticatedPlatformAdminResponse,
  PlatformAdmin,
} from '../types/platform-admin'

export function toAuthenticatedPlatformAdmin(admin: PlatformAdmin): AuthenticatedPlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    role: admin.role,
    ativo: admin.ativo,
    createdAt: admin.createdAt,
    ultimoAcessoEm: admin.ultimoAcessoEm,
  }
}

export function toAuthenticatedPlatformAdminResponse(
  admin: AuthenticatedPlatformAdmin,
): AuthenticatedPlatformAdminResponse {
  return {
    id: admin.id,
    name: admin.nome,
    email: admin.email,
    role: admin.role,
    active: admin.ativo,
    createdAt: admin.createdAt.toISOString(),
    lastAccessAt: admin.ultimoAcessoEm?.toISOString() ?? null,
  }
}
