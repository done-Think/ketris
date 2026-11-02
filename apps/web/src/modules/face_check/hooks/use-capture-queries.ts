import { useQuery } from '@tanstack/react-query'

import type { SessionStatus } from '../types'
import { isCaptureInFlight } from '../utils/session-status'

import { captureService } from '../services/capture-service'
import { captureKeys } from './capture-query-keys'

const waitingForAgency: SessionStatus[] = ['REVIEW', 'REJECTED']

export function useCaptureSession(token: string) {
  return useQuery({
    gcTime: 0,
    queryKey: captureKeys.session(token),
    queryFn: ({ signal }) => captureService.getSession(token, signal),
    refetchInterval: (query) =>
      waitingForAgency.includes(query.state.data?.status ?? 'CREATED') ? 3000 : false,
  })
}

export function useLivenessChallenges(token: string, selfieAccepted: boolean) {
  return useQuery({
    gcTime: 0,
    queryKey: captureKeys.challenges(token),
    enabled: selfieAccepted,
    queryFn: ({ signal }) => captureService.getChallenges(token, signal),
    staleTime: Infinity,
  })
}

export function useCaptureStatus(token: string) {
  return useQuery({
    gcTime: 0,
    queryKey: captureKeys.status(token),
    queryFn: ({ signal }) => captureService.getStatus(token, signal),
    refetchInterval: (query) =>
      !query.state.data || isCaptureInFlight(query.state.data.status) ? 400 : false,
  })
}
