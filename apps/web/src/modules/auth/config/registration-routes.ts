import type { RegistrationProfileId } from './registration-profiles'

export const registrationRoutes = {
  profile: '/cadastro',
  details: '/cadastro/dados',
} as const

export function getRegistrationDetailsRoute(profile: RegistrationProfileId) {
  return `${registrationRoutes.details}?perfil=${profile}`
}
