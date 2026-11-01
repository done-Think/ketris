import type { ReactNode } from 'react'
import type { StoreApi } from 'zustand'

import type {
  CaptureMode,
  CaptureSessionView,
  DocumentSide,
  DocumentType,
  LivenessChallenge,
  StepProgressTone,
} from './index'

export type CaptureStep =
  | 'consent'
  | 'camera'
  | 'document'
  | 'documentReview'
  | 'selfie'
  | 'submit'
  | 'result'
  | 'alternative'

export type ProgressStepName = 'consent' | 'document' | 'selfie' | 'submit'

export interface CaptureFlowState {
  step: CaptureStep
  documentType: DocumentType | null
  side: DocumentSide
  capturedSides: DocumentSide[]
  previews: Partial<Record<DocumentSide, string>>
  documentImages: Record<DocumentSide, Blob | null>
  setDocumentImage: (side: DocumentSide, image: Blob) => void
  clearImages: () => void
  livenessStep: number
  goTo: (step: CaptureStep) => void
  chooseDocument: (documentType: DocumentType) => void
  markCaptured: (side: DocumentSide, preview?: string) => void
  retakeSide: (side: DocumentSide) => void
  advanceLiveness: (totalChallenges: number) => void
  resetLiveness: () => void
  retryChallenges: () => void
  restartAttempt: () => void
}

export type CaptureFlowStore = StoreApi<CaptureFlowState>

export type DocumentGuide = 'idle' | 'warn' | 'ok'
export type DocumentOrientation = 'landscape' | 'portrait'

export type ViewportCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export type FaceRing = 'warn' | 'active' | 'ok'

export type SelfiePhase = 'position' | LivenessChallenge | 'done'

export interface CapturePageProps {
  token: string
}

export interface CaptureFlowProviderProps {
  children: ReactNode
}

export interface CaptureLayoutProps {
  captureMode?: CaptureMode
  children: ReactNode
  footer?: ReactNode
  tone?: StepProgressTone
  progressStep?: ProgressStepName
  onBack?: () => void
}

export interface CaptureStepProps {
  session: CaptureSessionView
}

export interface DocumentReviewStepProps {
  captureMode?: CaptureMode
}

export interface FaceViewportProps {
  ring: FaceRing
  arrow: 'left' | 'right' | null
  media: ReactNode
}

export interface DocumentUploadInput {
  side: DocumentSide
  documentType: DocumentType
}

export interface LivenessFrameInput {
  challenge: LivenessChallenge
  image: Blob
}

export interface LivenessProgressView {
  remaining: number
}

export interface DocumentImageUploadInput extends DocumentUploadInput {
  image: Blob
}

export type CameraFacing = 'environment' | 'user'

export type CameraStreamStatus =
  'starting' | 'live' | 'denied' | 'notFound' | 'insecure' | 'unsupported' | 'unavailable'

export interface CameraStream {
  status: CameraStreamStatus
  attachVideo: (node: HTMLVideoElement | null) => void
  grabFrame: () => Promise<Blob>
  restart: () => void
}

export interface FaceProximityOptions {
  token: string
  enabled: boolean
  grabFrame: () => Promise<Blob>
}

export interface CameraFallbackProps {
  token: string
  status: CameraStreamStatus
  allowGallery: boolean
  galleryInFooter?: boolean
  onFile: (file: File) => void
  onAlternative: () => void
  onRetry: () => void
  disabled?: boolean
}

export interface ContinueOnPhoneButtonProps {
  token: string
  disabled?: boolean
  dark?: boolean
}

export interface DocumentIntroProps {
  options: DocumentType[]
  selected: DocumentType
  side: DocumentSide
  onChoose: (type: DocumentType) => void
}

export interface PhotoErrorNoticeProps {
  error: unknown
}

export interface GalleryButtonProps {
  label: string
  onFile: (file: File) => void
  disabled?: boolean
  accept?: string
}

export interface ResultIllustrationProps {
  tone: 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
}
