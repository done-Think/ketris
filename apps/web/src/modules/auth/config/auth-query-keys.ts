import type { AuthQueryScope } from '../types/query'

export const authQueryKeys = {
  scope: (scope: AuthQueryScope) =>
    ['auth', scope.tenantId ?? null, scope.userId ?? null, scope.role ?? null] as const,
  users: (scope: AuthQueryScope) => [...authQueryKeys.scope(scope), 'users'] as const,
  currentUser: (scope: AuthQueryScope) => [...authQueryKeys.scope(scope), 'current-user'] as const,
}
