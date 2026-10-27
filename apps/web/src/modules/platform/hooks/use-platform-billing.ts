import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { platformQueryKeys } from '../config/platform-query-keys'
import { platformFinanceService } from '../services/platform-finance-service'
import { platformPlanService } from '../services/platform-plan-service'
import type { UpdatePlatformPlanPayload } from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant'
import { usePlatformActor } from './use-platform-actor'

export function usePlatformPlans() {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.plans(actor.key),
    queryFn: () => platformPlanService.list(),
    enabled: actor.enabled,
  })
}

export function useUpdatePlatformPlan() {
  const queryClient = useQueryClient()
  const actor = usePlatformActor()

  return useMutation({
    mutationFn: ({
      accountType,
      ...payload
    }: UpdatePlatformPlanPayload & { accountType: TenantAccountType }) =>
      platformPlanService.update(accountType, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.all(actor.key) }),
  })
}

export function usePlatformFinance() {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.finance(actor.key),
    queryFn: () => platformFinanceService.get(),
    enabled: actor.enabled,
  })
}
