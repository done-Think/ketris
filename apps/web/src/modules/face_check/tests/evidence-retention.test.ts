import { describe, expect, it } from 'vitest'

import { areEvidenceImagesDeleted, evidenceReviewKey } from '../utils/evidence-retention'

describe('face_check evidence retention', () => {
  it('requires a new evidence reveal after a new capture consent', () => {
    const initial = {
      id: 'session',
      attemptsUsed: 1,
      timeline: [
        {
          id: 'consent-1',
          kind: 'consented' as const,
          actor: 'person',
          at: '2026-11-01T12:00:00Z',
        },
      ],
    }
    const next = {
      ...initial,
      timeline: [
        ...initial.timeline,
        {
          id: 'consent-2',
          kind: 'consented' as const,
          actor: 'person',
          at: '2026-11-01T13:00:00Z',
        },
      ],
    }
    expect(evidenceReviewKey(next)).not.toBe(evidenceReviewKey(initial))
  })
  it('stops displaying image requests after a final decision', () => {
    expect(areEvidenceImagesDeleted({ status: 'APPROVED' })).toBe(true)
    expect(areEvidenceImagesDeleted({ status: 'REJECTED' })).toBe(true)
  })
  it('stops displaying images when deletion is recorded or seven-day retention expires', () => {
    expect(
      areEvidenceImagesDeleted({ status: 'REVIEW', evidenceDeletedAt: '2026-11-01T12:00:00Z' }),
    ).toBe(true)
    expect(
      areEvidenceImagesDeleted(
        { status: 'REVIEW', evidenceExpiresAt: '2026-11-01T12:00:00Z' },
        Date.parse('2026-11-01T12:00:00Z'),
      ),
    ).toBe(true)
  })
  it('keeps captured images available before the retention deadline', () => {
    expect(
      areEvidenceImagesDeleted(
        { status: 'REVIEW', evidenceDeletedAt: null, evidenceExpiresAt: '2026-11-08T12:00:00Z' },
        Date.parse('2026-11-01T12:00:00Z'),
      ),
    ).toBe(false)
  })
})
