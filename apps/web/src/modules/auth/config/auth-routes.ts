import type { AuthRoute, RegistrationProfileId } from '../types/registration'

export const authRoutes = {
  login: '/login',
  register: '/register',
  registerDetails: '/register/details',
  forgotPassword: '/forgot-password',
} as const satisfies Record<string, AuthRoute>

export function getRegisterDetailsRoute(profile: RegistrationProfileId) {
  return {
    pathname: authRoutes.registerDetails,
    query: { profile },
  } as const
}
