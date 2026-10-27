import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { platformQueryKeys } from '../config/platform-query-keys'
import { platformAdminService } from '../services/platform-admin-service'
import type {
  CreatePlatformAdminInput,
  PlatformAdminAccount,
  UpdatePlatformAdminInput,
} from '../types/platform-admin'
import { usePlatformActor } from './use-platform-actor'

export function usePlatformAdmins() {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.admins(actor.key),
    queryFn: () => platformAdminService.list(),
    enabled: actor.enabled,
  })
}

function usePlatformAdminMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<PlatformAdminAccount>,
) {
  const queryClient = useQueryClient()
  const actor = usePlatformActor()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.admins(actor.key) }),
  })
}

export function useCreatePlatformAdmin() {
  return usePlatformAdminMutation((payload: CreatePlatformAdminInput) =>
    platformAdminService.create(payload),
  )
}

export function useUpdatePlatformAdmin() {
  return usePlatformAdminMutation(({ id, ...payload }: UpdatePlatformAdminInput) =>
    platformAdminService.update(id, payload),
  )
}

export function useActivatePlatformAdmin() {
  return usePlatformAdminMutation((id: string) => platformAdminService.activate(id))
}

export function useDeactivatePlatformAdmin() {
  return usePlatformAdminMutation((id: string) => platformAdminService.deactivate(id))
}
