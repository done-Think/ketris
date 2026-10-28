import type { components } from './generated/api'
export type UserRole = components['schemas']['AuthenticatedUserResponse']['role']
export type PlatformAdminRole = components['schemas']['AuthenticatedPlatformAdmin']['role']
