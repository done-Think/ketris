import { randomBytes, randomUUID } from 'node:crypto'

import { similarityPolicy } from '@server/face_check/config/similarity-policy'
import type { VerificationSettings } from '@server/face_check/types/session.types'

import type { VerificationDependencies } from '../types/verification.types'
import { analyzeSessionUseCase } from './application/use-cases/analysis'
import { documentRegionsUseCase } from './application/use-cases/document-regions'
import { livenessProximityUseCase } from './application/use-cases/liveness-proximity'
import { selfieFramingUseCase } from './application/use-cases/selfie-framing'
import {
  consentUseCase,
  getCaptureSessionUseCase,
  getCaptureStatusUseCase,
  getChallengesUseCase,
  requestAlternativeUseCase,
  submitCaptureUseCase,
  uploadDocumentPhotoUseCase,
  uploadSelfieUseCase,
  verifyLivenessFrameUseCase,
} from './application/use-cases/capture'
import {
  createSessionUseCase,
  decideSessionUseCase,
  getEvidenceUseCase,
  getSessionUseCase,
  listSessionsUseCase,
  recordEvidenceViewUseCase,
  reopenSessionUseCase,
} from './application/use-cases/sessions'
import {
  getOverviewUseCase,
  getSettingsUseCase,
  updateSettingsUseCase,
} from './application/use-cases/settings'
import { defaultMaxAttempts } from './domain/session-rules'

export function defaultSettings(agencyName: string): VerificationSettings {
  return {
    agencyName,
    faceMatchThreshold: similarityPolicy.approveAbove,
    maxAttempts: defaultMaxAttempts,
    allowGalleryUpload: true,
  }
}

export const defaultIdentity = {
  newToken: () => randomBytes(32).toString('hex'),
  newId: () => randomUUID(),
}

export function buildVerificationUseCases(deps: VerificationDependencies) {
  const analyzeSession = analyzeSessionUseCase(deps)

  return {
    livenessProximityUseCase: livenessProximityUseCase(deps),
    selfieFramingUseCase: selfieFramingUseCase(deps),
    documentRegionsUseCase: documentRegionsUseCase(deps),
    listSessionsUseCase: listSessionsUseCase(deps),
    getSessionUseCase: getSessionUseCase(deps),
    createSessionUseCase: createSessionUseCase(deps),
    recordEvidenceViewUseCase: recordEvidenceViewUseCase(deps),
    getEvidenceUseCase: getEvidenceUseCase(deps),
    decideSessionUseCase: decideSessionUseCase(deps),
    reopenSessionUseCase: reopenSessionUseCase(deps),
    getCaptureSessionUseCase: getCaptureSessionUseCase(deps),
    consentUseCase: consentUseCase(deps),
    uploadDocumentPhotoUseCase: uploadDocumentPhotoUseCase(deps),
    getChallengesUseCase: getChallengesUseCase(deps),
    uploadSelfieUseCase: uploadSelfieUseCase(deps),
    verifyLivenessFrameUseCase: verifyLivenessFrameUseCase(deps),
    submitCaptureUseCase: submitCaptureUseCase(deps, analyzeSession),
    getCaptureStatusUseCase: getCaptureStatusUseCase(deps),
    requestAlternativeUseCase: requestAlternativeUseCase(deps),
    analyzeSessionUseCase: analyzeSession,
    getSettingsUseCase: getSettingsUseCase(deps),
    updateSettingsUseCase: updateSettingsUseCase(deps),
    getOverviewUseCase: getOverviewUseCase(deps),
  }
}
