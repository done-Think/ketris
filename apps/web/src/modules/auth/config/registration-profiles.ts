import type { RegistrationProfile, RegistrationProfileId } from '../types/registration'

export const REGISTRATION_PROFILE_IDS = [
  'proprietario',
  'corretor',
  'imobiliaria',
  'construtora',
  'locatario',
] as const satisfies readonly RegistrationProfileId[]

export const DEFAULT_REGISTRATION_PROFILE: RegistrationProfileId = 'proprietario'

export const REGISTRATION_PROFILES: readonly RegistrationProfile[] = [
  {
    id: 'proprietario',
    icon: 'owner',
  },
  {
    id: 'corretor',
    icon: 'broker',
  },
  {
    id: 'imobiliaria',
    icon: 'agency',
  },
  {
    id: 'construtora',
    icon: 'developer',
  },
  {
    id: 'locatario',
    icon: 'tenant',
  },
]

export function isRegistrationProfileId(value: unknown): value is RegistrationProfileId {
  return REGISTRATION_PROFILE_IDS.includes(value as RegistrationProfileId)
}
