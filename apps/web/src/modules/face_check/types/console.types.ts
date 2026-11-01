import type { SvgIconComponent } from '@mui/icons-material'
import type { ReactNode } from 'react'

import type {
  CaptureEvidence,
  CreatedSession,
  OverviewMetrics,
  SessionFilter,
  SessionSignal,
  VerificationSession,
  VerificationSettings,
} from './index'

export type ConsoleNavKey = 'overview' | 'sessions' | 'review' | 'settings'

export interface ConsoleNavItem {
  key: ConsoleNavKey
  href: string
  Icon: SvgIconComponent
}

export interface ConsoleShellProps {
  children: ReactNode
}

export interface ConsoleNavProps {
  reviewActive: boolean
  onNavigate?: () => void
}

export interface ReadableSearchParams {
  get: (name: string) => string | null
}

export interface SessionListParams {
  filter: SessionFilter
  search: string
  page: number
}

export interface NewVerificationDialogProps {
  open: boolean
  onClose: () => void
}

export interface NewVerificationContentProps {
  onClose: () => void
}

export interface CreatedLinkPanelProps {
  created: CreatedSession
  onClose: () => void
}

export interface OverviewSectionProps {
  overview: OverviewMetrics
}

export interface SessionCardProps {
  session: VerificationSession
}

export interface SettingsFormProps {
  settings: VerificationSettings
}

export interface SessionDetailPageProps {
  id: string
}

export interface SignalRowProps {
  signal: SessionSignal
}

export interface CheckRowProps {
  label: string
  detail: string
  result: boolean | null
}

export interface EvidenceGridProps {
  session: VerificationSession
  revealed: boolean
}

export interface SessionsFiltersProps {
  params: SessionListParams
  counts: Record<SessionFilter, number> | undefined
  onChange: (next: Partial<SessionListParams>) => void
}

export interface SessionsGridProps {
  params: SessionListParams
  rows: VerificationSession[]
  total: number
  loading: boolean
  onPageChange: (page: number) => void
}

export interface KpiItem {
  key: 'completed' | 'autoApproval' | 'inReview' | 'decisionTime' | 'redo'
  value: string
  caption: string
}

export type DiagnosticRowKey =
  | 'resolution'
  | 'brightness'
  | 'documentBrightness'
  | 'sharpness'
  | 'textRegions'
  | 'documentFace'
  | 'faceSize'
  | 'eyeDistance'
  | 'realProbability'
  | 'turn'
  | 'closer'
  | 'samePerson'

export type DiagnosticLimit =
  | { kind: 'min'; value: number }
  | { kind: 'max'; value: number }
  | { kind: 'range'; min: number; max: number }

export interface DiagnosticRow {
  key: DiagnosticRowKey
  value: number
  limit: DiagnosticLimit | null
  passed: boolean | null
}

export interface EvidenceDiagnosticsProps {
  evidence: CaptureEvidence
}
