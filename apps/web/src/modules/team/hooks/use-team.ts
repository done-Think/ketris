import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'

import type { AppLocale } from '@/i18n/types/locale.types'

import { teamQueryKeys } from '../config/team-query-keys'
import { teamService } from '../services/team-service'
import type { TransferPortfolioPayload } from '../types/team'

function useTeamScope() {
  const { data: session } = useSession()

  return {
    key: `${session?.tenantId ?? ''}:${session?.user?.id ?? ''}`,
    enabled: Boolean(session?.accessToken) && session?.role === 'OWNER',
  }
}

export function useTeamOverview() {
  const scope = useTeamScope()

  return useQuery({
    queryKey: teamQueryKeys.overview(scope.key),
    queryFn: () => teamService.overview(),
    enabled: scope.enabled,
  })
}

export function useBrokerGoals(memberId: string) {
  const scope = useTeamScope()

  return useQuery({
    queryKey: teamQueryKeys.goals(scope.key, memberId),
    queryFn: () => teamService.goals(memberId),
    enabled: scope.enabled,
  })
}

function useTeamMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  const scope = useTeamScope()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(scope.key) }),
  })
}

export function useSetBrokerGoal() {
  return useTeamMutation(({ memberId, monthlySales }: { memberId: string; monthlySales: number }) =>
    teamService.setGoal(memberId, monthlySales),
  )
}

export function useTransferPortfolio() {
  return useTeamMutation(
    ({ memberId, ...payload }: TransferPortfolioPayload & { memberId: string }) =>
      teamService.transfer(memberId, payload),
  )
}

export function useDeactivateBroker() {
  return useTeamMutation(
    ({ memberId, destinationId }: { memberId: string; destinationId: string }) =>
      teamService.deactivate(memberId, destinationId),
  )
}

export function useActivateBroker() {
  return useTeamMutation((memberId: string) => teamService.activate(memberId))
}

export function useInviteBroker() {
  const locale = useLocale() as AppLocale

  return useTeamMutation(({ name, email }: { name: string; email: string }) =>
    teamService.invite({ name, email, locale }),
  )
}

export function useResendInvitation() {
  const locale = useLocale() as AppLocale

  return useTeamMutation((memberId: string) => teamService.resendInvitation(memberId, locale))
}

export function useCancelInvitation() {
  return useTeamMutation((memberId: string) => teamService.cancelInvitation(memberId))
}

export function useTeamInvitation(token: string | null) {
  return useQuery({
    queryKey: teamQueryKeys.invitation(token ?? ''),
    queryFn: () => teamService.previewInvitation(token ?? ''),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useAcceptTeamInvitation() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      teamService.acceptInvitation(token, password),
  })
}
