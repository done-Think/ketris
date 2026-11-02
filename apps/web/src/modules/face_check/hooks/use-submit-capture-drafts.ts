import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  deferredLivenessPlanSchema,
  livenessSequenceSchema,
} from '../schemas/liveness-sequence.schema'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { useCaptureFlow, useCaptureRequestSignal } from '../stores/CaptureFlowProvider'
import type { CaptureFlowState } from '../types/capture.types'
import type { CaptureUploadSlot } from '../types/capture-draft.types'
import { captureKeys } from './capture-query-keys'

type Submission = Pick<
  CaptureFlowState,
  'documentType' | 'documentImages' | 'selfieImage' | 'movementImages' | 'plan' | 'uploaded'
>

export function useSubmitCaptureDrafts(token: string) {
  const client = useQueryClient()
  const getSignal = useCaptureRequestSignal()
  const remember = useCaptureFlow((state) => state.rememberUpload)
  const [stage, setStage] = useState<CaptureUploadSlot | null>(null)
  const mutation = useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: async (draft: Submission) => {
      const plan = deferredLivenessPlanSchema.safeParse(draft.plan)
      const { front, back } = draft.documentImages
      if (
        !plan.success ||
        !draft.documentType ||
        !front ||
        !back ||
        !draft.selfieImage ||
        plan.data.challenges.some((challenge) => !draft.movementImages[challenge])
      )
        throw new ApiError('IMAGE_REQUIRED', 400)
      const signal = getSignal()
      // Recover an acknowledgement lost after submission, without uploading the photos twice.
      const status = await captureService.getStatus(token, signal)
      if (status.status !== 'IN_PROGRESS') return status
      if (Date.parse(plan.data.expiresAt) <= Date.now()) throw new ApiError('SESSION_EXPIRED', 410)
      const planId = plan.data.planId
      for (const side of ['front', 'back'] as const) {
        const image = side === 'front' ? front : back
        if (draft.uploaded[side] === image) continue
        setStage(side)
        await captureService.uploadDocumentImage(
          token,
          { side, documentType: draft.documentType, image, planId },
          signal,
        )
        remember(side, image)
      }
      if (draft.uploaded.selfie !== draft.selfieImage) {
        setStage('selfie')
        await captureService.uploadSelfie(token, draft.selfieImage, signal, planId)
        remember('selfie', draft.selfieImage)
      }
      const next = livenessSequenceSchema.safeParse(
        await captureService.startLiveness(token, signal, planId),
      )
      if (!next.success) throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
      const issued = next.data
      if (issued.challenges.join(',') !== plan.data.challenges.join(','))
        throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
      for (let index = issued.step; index < issued.challenges.length; index++) {
        const challenge = issued.challenges[index]
        const image = draft.movementImages[challenge]!
        setStage(challenge)
        const result = await captureService.uploadLivenessFrame(
          token,
          { challenge, image, planId },
          signal,
        )
        if (result.remaining !== issued.challenges.length - index - 1)
          throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
        remember(challenge, image)
      }
      setStage(null)
      return captureService.submit(token, signal, planId)
    },
    onSuccess: (status) => client.setQueryData(captureKeys.status(token), status),
    onError: () => client.invalidateQueries({ queryKey: captureKeys.session(token) }),
  })
  return { ...mutation, stage }
}
