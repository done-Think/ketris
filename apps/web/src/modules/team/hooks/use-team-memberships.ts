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

function useMembershipDecision<TResult>(decide: (userId: string) => Promise<TResult>) {
  const client = useQueryClient()
  const scope = useTenantSessionScope()
  return useMutation({
    mutationFn: decide,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['team-memberships', scope.tenantId] }),
        client.invalidateQueries({ queryKey: ['team'] }),
        client.invalidateQueries({ queryKey: ['auth', scope.tenantId] }),
      ]),
  })
}

export function useApproveTeamMembership() {
  return useMembershipDecision((userId: string) => teamService.approveMembership(userId))
}

export function useRejectTeamMembership() {
  return useMembershipDecision((userId: string) => teamService.rejectMembership(userId))
}
