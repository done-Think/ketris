import type {
  PlatformAdminAccount,
  PlatformAdminRoleFilter,
  PlatformAdminsListState,
  PlatformAdminStatusFilter,
} from '../types/platform-admin'

const statusFilters: readonly PlatformAdminStatusFilter[] = ['all', 'active', 'inactive']
const roleFilters: readonly PlatformAdminRoleFilter[] = ['all', 'ADMIN', 'ADMIN_AGENT', 'AGENT']

export function toPlatformAdminStatusFilter(value: string): PlatformAdminStatusFilter {
  return statusFilters.find((status) => status === value) ?? 'all'
}

export function toPlatformAdminRoleFilter(value: string): PlatformAdminRoleFilter {
  return roleFilters.find((role) => role === value) ?? 'all'
}

export function filterPlatformAdmins(
  admins: readonly PlatformAdminAccount[],
  { search, status, role }: Pick<PlatformAdminsListState, 'search' | 'status' | 'role'>,
): PlatformAdminAccount[] {
  const query = search.trim().toLocaleLowerCase()

  return admins.filter(
    (admin) =>
      (!query || `${admin.name} ${admin.email}`.toLocaleLowerCase().includes(query)) &&
      (status === 'all' || (status === 'active' ? admin.active : !admin.active)) &&
      (role === 'all' || admin.role === role),
  )
}

export function adminInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
