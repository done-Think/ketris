import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { platformPlanService } from '../services/platform-plan-service'
import type { UpdatePlatformPlanPayload } from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant'

export function usePlatformPlans() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'plans'],
    queryFn: () => platformPlanService.list(),
    // Same as the other platform queries: only request once the session token is available.
    enabled: Boolean(session?.accessToken),
  })
}

export function useUpdatePlatformPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      accountType,
      ...payload
    }: UpdatePlatformPlanPayload & { accountType: TenantAccountType }) =>
      platformPlanService.update(accountType, payload),
    // Prices change every tenant's monthly charge and the platform revenue.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  })
}
