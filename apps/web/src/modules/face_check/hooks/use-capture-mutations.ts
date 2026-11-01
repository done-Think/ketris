import { useMutation, useQueryClient } from '@tanstack/react-query'

import { consentTermsVersion } from '../utils/consent-terms'
import type { AlternativeRequestInput, CaptureMode, CaptureSessionView } from '../types'

import { captureService } from '../services/capture-service'
import { useCaptureRequestSignal } from '../stores/CaptureFlowProvider'
import type { DocumentImageUploadInput, LivenessFrameInput } from '../types/capture.types'
import { captureKeys } from './capture-query-keys'

function useSetCaptureSession(token: string) {
  const queryClient = useQueryClient()

  return (session: CaptureSessionView) =>
    queryClient.setQueryData(captureKeys.session(token), session)
}

export function useConsent(token: string, captureMode: CaptureMode) {
  const setSession = useSetCaptureSession(token)
  const queryClient = useQueryClient()

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    mutationFn: () =>
      captureService.consent(
        token,
        {
          accepted: true,
          termsVersion: consentTermsVersion[captureMode],
        },
        getSignal(),
      ),
    onSuccess: (session) => {
      setSession(session)
      queryClient.removeQueries({ queryKey: captureKeys.challenges(token) })
      queryClient.removeQueries({ queryKey: captureKeys.status(token) })
    },
  })
}

function useRefreshSessionOnError(token: string) {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: captureKeys.session(token) })
}

export function useUploadDocumentImage(token: string) {
  const refreshSession = useRefreshSessionOnError(token)

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    mutationFn: (input: DocumentImageUploadInput) =>
      captureService.uploadDocumentImage(token, input, getSignal()),
    onError: refreshSession,
  })
}

export function useUploadSelfie(token: string) {
  const queryClient = useQueryClient()
  const refreshSession = useRefreshSessionOnError(token)

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: captureKeys.challenges(token) })
      await queryClient.resetQueries({ queryKey: captureKeys.challenges(token) })
    },
    mutationFn: (selfie: Blob) => captureService.uploadSelfie(token, selfie, getSignal()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: captureKeys.challenges(token) }),
    onError: refreshSession,
  })
}

export function useUploadLivenessFrame(token: string) {
  const queryClient = useQueryClient()
  const refreshSession = useRefreshSessionOnError(token)

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    mutationFn: (input: LivenessFrameInput) =>
      captureService.uploadLivenessFrame(token, input, getSignal()),
    onError: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: captureKeys.challenges(token) }),
        refreshSession(),
      ])
    },
  })
}

export function useSubmitCapture(token: string) {
  const queryClient = useQueryClient()

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    mutationFn: () => captureService.submit(token, getSignal()),
    onSuccess: (status) => queryClient.setQueryData(captureKeys.status(token), status),
  })
}

export function useRequestAlternative(token: string) {
  const setSession = useSetCaptureSession(token)

  const getSignal = useCaptureRequestSignal()
  return useMutation({
    gcTime: 0,
    mutationFn: (input: AlternativeRequestInput) =>
      captureService.requestAlternative(token, input, getSignal()),
    onSuccess: setSession,
  })
}
