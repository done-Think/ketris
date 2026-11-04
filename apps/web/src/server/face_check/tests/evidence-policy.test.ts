// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  evidencePurgeSchedulingMarginMs,
  evidenceRetentionMs,
  evidenceUnavailable,
  maximumEvidenceRetentionMs,
} from '../verification/domain/evidence-policy'
import { createInput, verificationHarness } from './fixtures/verification-harness'

describe('face_check image retention scheduling', () => {
  it('reserves an explicit one-hour scheduling margin below the maximum seven-day retention', () => {
    expect(maximumEvidenceRetentionMs).toBe(7 * 24 * 60 * 60 * 1000)
    expect(evidencePurgeSchedulingMarginMs).toBe(60 * 60 * 1000)
    expect(evidenceRetentionMs).toBe(6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000)
  })

  it('blocks image access exactly at its stored deadline even before scheduled deletion runs', async () => {
    const h = verificationHarness()
    const session = await h.cases.createSessionUseCase.execute(createInput)
    const expiry = h.deps.clock() + evidenceRetentionMs
    session.evidenceExpiresAt = new Date(expiry).toISOString()
    expect(evidenceUnavailable(session, expiry - 1)).toBe(false)
    expect(evidenceUnavailable(session, expiry)).toBe(true)
    session.evidenceExpiresAt = null
    session.evidencePurgePending = true
    expect(evidenceUnavailable(session, h.deps.clock())).toBe(true)
  })
})
