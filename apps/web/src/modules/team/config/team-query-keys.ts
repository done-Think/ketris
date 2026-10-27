export const teamQueryKeys = {
  all: (scope: string) => ['team', scope] as const,
  overview: (scope: string) => [...teamQueryKeys.all(scope), 'overview'] as const,
  goals: (scope: string, memberId: string) =>
    [...teamQueryKeys.all(scope), 'goals', memberId] as const,
  invitation: (token: string) => ['team-invitation', token] as const,
}
