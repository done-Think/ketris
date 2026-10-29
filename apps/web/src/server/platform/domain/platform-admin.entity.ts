import type {
  AuthenticatedPlatformAdmin,
  AuthenticatedPlatformAdminResponse,
  PlatformAdmin,
} from '../types/platform-admin'

export function toAuthenticatedPlatformAdmin(admin: PlatformAdmin): AuthenticatedPlatformAdmin {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    active: admin.active,
    createdAt: admin.createdAt,
    lastAccessAt: admin.lastAccessAt,
  }
}

export function toAuthenticatedPlatformAdminResponse(
  admin: AuthenticatedPlatformAdmin,
): AuthenticatedPlatformAdminResponse {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    active: admin.active,
    createdAt: admin.createdAt.toISOString(),
    lastAccessAt: admin.lastAccessAt?.toISOString() ?? null,
  }
}
