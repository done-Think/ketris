import type { UserRole } from '@shared/types/user-role'

export type TenantAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'

/** Who the signed-in person is, from role plus the account type of their tenant. */
export type AccessProfile =
  'AGENCY_MANAGER' | 'SOLO_BROKER' | 'INDIVIDUAL_OWNER' | 'AGENT' | 'PROPERTY_OWNER' | 'RENTER'

export type DashboardFeature =
  | 'dashboard'
  | 'pipeline'
  | 'contacts'
  | 'leads'
  | 'team'
  | 'properties'
  | 'contracts'
  | 'faceCheck'
  | 'faceCheckMyVerifications'
  | 'publicProfile'
  | 'agencyPublicProfile'
  | 'agenda'
  | 'maintenance'
  | 'finance'
  | 'charges'

/**
 * Single source of truth for what each profile may open. The sidebar is derived from it and the
 * server layouts enforce it per route. APIs remain the final authority on data.
 */
export const dashboardFeaturesByProfile: Record<AccessProfile, readonly DashboardFeature[]> = {
  AGENCY_MANAGER: [
    'dashboard',
    'pipeline',
    'contacts',
    'leads',
    'team',
    'properties',
    'contracts',
    'faceCheck',
    'faceCheckMyVerifications',
    'agencyPublicProfile',
    'agenda',
    'maintenance',
    'finance',
    'charges',
  ],
  SOLO_BROKER: [
    'dashboard',
    'pipeline',
    'contacts',
    'leads',
    'properties',
    'contracts',
    'faceCheck',
    'faceCheckMyVerifications',
    'publicProfile',
    'agenda',
    'maintenance',
    'charges',
  ],
  INDIVIDUAL_OWNER: [
    'properties',
    'contracts',
    'faceCheckMyVerifications',
    'agenda',
    'maintenance',
    'charges',
  ],
  AGENT: [
    'pipeline',
    'contacts',
    'leads',
    'properties',
    'contracts',
    'faceCheck',
    'faceCheckMyVerifications',
    'publicProfile',
    'agenda',
    'maintenance',
  ],
  PROPERTY_OWNER: [
    'properties',
    'contracts',
    'charges',
    'maintenance',
    'agenda',
    'faceCheckMyVerifications',
  ],
  RENTER: ['charges', 'maintenance', 'agenda', 'properties', 'faceCheckMyVerifications'],
}

export function resolveAccessProfile(
  role: UserRole | undefined,
  accountType: TenantAccountType | undefined,
): AccessProfile | null {
  if (role === 'AGENT' || role === 'PROPERTY_OWNER' || role === 'RENTER') return role
  if (role !== 'OWNER') return null
  if (accountType === 'AGENCY') return 'AGENCY_MANAGER'
  if (accountType === 'BROKER') return 'SOLO_BROKER'
  if (accountType === 'INDIVIDUAL') return 'INDIVIDUAL_OWNER'
  return null
}

export function canAccessFeature(profile: AccessProfile | null, feature: DashboardFeature) {
  return profile !== null && dashboardFeaturesByProfile[profile].includes(feature)
}

export const dashboardFeatureHrefs = {
  dashboard: '/dashboard',
  pipeline: '/crm',
  contacts: '/crm/contacts',
  leads: '/dashboard/leads',
  team: '/dashboard/team',
  properties: '/dashboard/properties',
  contracts: '/dashboard/contracts',
  faceCheck: '/dashboard/face_check',
  faceCheckMyVerifications: '/dashboard/face_check/my-verifications',
  publicProfile: '/dashboard/public-profile',
  agencyPublicProfile: '/dashboard/public-profile/agency',
  agenda: '/dashboard/agenda',
  maintenance: '/dashboard/maintenance',
  finance: '/dashboard/finance',
  charges: '/dashboard/finance/charges',
} as const satisfies Record<DashboardFeature, string>

export function navigationHrefsFor(profile: AccessProfile): readonly string[] {
  return dashboardFeaturesByProfile[profile].map((feature) => dashboardFeatureHrefs[feature])
}
