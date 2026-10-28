import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { teamService } from '../services/team-service'

export function useTeamMembershipRequests(enabled = true) {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: ['team-memberships', scope.tenantId, ...scope.actorKey],
    queryFn: () => teamService.membershipRequests(),
    enabled: enabled && scope.enabled && scope.role === 'OWNER',
  })
}

export function useApproveTeamMembership() {
  const client = useQueryClient()
  const scope = useTenantSessionScope()
  return useMutation({
    mutationFn: (userId: string) => teamService.approveMembership(userId),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['team-memberships', scope.tenantId] }),
        client.invalidateQueries({ queryKey: ['team'] }),
        client.invalidateQueries({ queryKey: ['auth', scope.tenantId] }),
      ]),
  })
}
