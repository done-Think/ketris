import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionDetailPage } from '../components/console/detail/SessionDetailPage'
import { useSession } from '../hooks/use-console-queries'
import { ApiError } from '../services/api-error'
import type { VerificationSession } from '../types'

vi.mock('../hooks/use-console-queries', () => ({ useSession: vi.fn() }))
vi.mock('../components/console/detail/EvidenceCard', () => ({
  EvidenceCard: () => <span role="img" aria-label="Private evidence" />,
}))
vi.mock('../components/console/detail/DecisionCard', () => ({ DecisionCard: () => null }))
vi.mock('../components/console/detail/DocumentCheckCard', () => ({ DocumentCheckCard: () => null }))
vi.mock('../components/console/detail/SignalsCard', () => ({ SignalsCard: () => null }))
vi.mock('../components/console/detail/TimelineCard', () => ({ TimelineCard: () => null }))

const session: VerificationSession = {
  id: 'session',
  token: 'token',
  personName: 'Private person',
  agencyName: 'Agency',
  reference: 'Property',
  contact: null,
  acceptedDocument: 'RG',
  documentType: 'RG',
  status: 'REVIEW',
  createdAt: '2026-11-01T12:00:00Z',
  updatedAt: '2026-11-01T12:00:00Z',
  expiresAt: '2026-11-08T12:00:00Z',
  captureDeadline: null,
  decidedAt: null,
  submittedAt: null,
  attemptsUsed: 1,
  maxAttempts: 3,
  reviewReason: 'livenessInconclusive',
  redoReason: null,
  alternativePath: false,
  propertyId: 'property',
  purpose: 'RENT',
  captureMode: 'camera',
  evidence: ['front', 'back', 'selfie'],
  evidenceHistory: [],
  similarityAttempts: [],
  alerts: [],
  cpf: null,
  documentCheck: null,
  signals: [],
  timeline: [],
}

describe('face_check detail access revocation', () => {
  it.each([401, 403, 404])(
    'unmounts private images and data after a polling denial (%s)',
    (status) => {
      vi.mocked(useSession, { partial: true }).mockReturnValue({
        data: session,
        error: null,
        isPending: false,
      })
      const view = render(<SessionDetailPage id="session" />)
      expect(screen.getByText('Private person')).toBeVisible()
      expect(screen.getByRole('img', { name: 'Private evidence' })).toBeVisible()
      vi.mocked(useSession, { partial: true }).mockReturnValue({
        data: session,
        error: new ApiError('SESSION_NOT_FOUND', status),
        isPending: false,
      })
      view.rerender(<SessionDetailPage id="session" />)
      expect(screen.queryByText('Private person')).not.toBeInTheDocument()
      expect(screen.queryByRole('img', { name: 'Private evidence' })).not.toBeInTheDocument()
      view.unmount()
    },
  )
})
