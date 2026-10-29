import type { RegistrationProfile, RegistrationProfileId } from '../types/registration'

export const REGISTRATION_PROFILE_IDS = [
  'owner',
  'broker',
  'agency',
  'developer',
  'renter',
] as const satisfies readonly RegistrationProfileId[]

export const DEFAULT_REGISTRATION_PROFILE: RegistrationProfileId = 'owner'

export const REGISTRATION_PROFILES: readonly RegistrationProfile[] = [
  {
    id: 'owner',
    icon: 'owner',
  },
  {
    id: 'broker',
    icon: 'broker',
  },
  {
    id: 'agency',
    icon: 'agency',
  },
  {
    id: 'developer',
    icon: 'developer',
  },
  {
    id: 'renter',
    icon: 'tenant',
  },
]

export function isRegistrationProfileId(value: unknown): value is RegistrationProfileId {
  return REGISTRATION_PROFILE_IDS.includes(value as RegistrationProfileId)
}
