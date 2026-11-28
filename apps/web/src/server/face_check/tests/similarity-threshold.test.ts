// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { decideSimilarity } from '../face-match/similarity-policy'

const base = { attempt: 1, maxAttempts: 3, checksPassed: true, autoApproval: false }

describe('agency similarity threshold', () => {
  it('treats a score above the default floor as a strong match', () => {
    expect(decideSimilarity({ ...base, similarity: 0.4 }).reviewReason).toBe('autoApprovalPaused')
  })

  it('treats the same score as only an experimental match when the agency is stricter', () => {
    expect(decideSimilarity({ ...base, similarity: 0.4, approveAbove: 0.6 }).reviewReason).toBe(
      'experimentalMatch',
    )
  })

  it('never goes below the platform floor', () => {
    expect(decideSimilarity({ ...base, similarity: 0.2, approveAbove: 0.1 }).reviewReason).toBe(
      'experimentalMatch',
    )
  })
})
