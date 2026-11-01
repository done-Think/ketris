import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateSessionInput, DecisionInput, VerificationSettings } from '../types'

import { consoleService } from '../services/console-service'
import { consoleKeys } from './console-query-keys'

function useInvalidateSessions() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: consoleKeys.sessions }),
      queryClient.invalidateQueries({ queryKey: consoleKeys.overview }),
    ])
}

export function useCreateSession() {
  const invalidate = useInvalidateSessions()

  return useMutation({
    gcTime: 0,
    mutationFn: (input: CreateSessionInput) => consoleService.createSession(input),
    onSuccess: invalidate,
  })
}

export function useRecordEvidenceView(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    gcTime: 0,
    mutationFn: () => consoleService.recordEvidenceView(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consoleKeys.session(id) }),
  })
}

export function useDecideSession(id: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateSessions()

  return useMutation({
    gcTime: 0,
    mutationFn: (input: DecisionInput) => consoleService.decide(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: consoleKeys.session(id) })
      await invalidate()
    },
  })
}

export function useReopenSession(id: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateSessions()

  return useMutation({
    gcTime: 0,
    mutationFn: () => consoleService.reopen(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: consoleKeys.session(id) })
      await invalidate()
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateSessions()

  return useMutation({
    gcTime: 0,
    mutationFn: (settings: VerificationSettings) => consoleService.updateSettings(settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: consoleKeys.settings })
      await invalidate()
    },
  })
}
