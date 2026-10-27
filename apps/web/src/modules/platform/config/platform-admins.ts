import type { PlatformAdminRole } from '../types/platform-admin'

export const platformAdminsPageSize = 10

export const emptyPlatformAdminsFilters = {
  search: '',
  status: 'all',
  role: 'all',
  page: 1,
} as const

export const platformAdminRoles: readonly PlatformAdminRole[] = ['ADMIN', 'ADMIN_AGENT', 'AGENT']
