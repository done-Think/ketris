import { describe, expect, it } from 'vitest'

import { createDecisionSchema, decisionSchema } from '../schemas/console.schemas'
import { buildDecisionInput } from '../utils/decision-input'

const override = {
  decision: 'approve',
  reason: 'liveness',
  note: 'Reviewed all images and confirmed the person.',
  manualOverride: true,
  reviewedEvidence: true,
} as const

describe('audited manual face_check approval', () => {
  it('requires the override path when the server analysis did not complete all checks', () => {
    expect(
      createDecisionSchema(true).safeParse({ decision: 'approve', reason: null, note: '' }).success,
    ).toBe(false)
    expect(createDecisionSchema(true).safeParse(override).success).toBe(true)
    expect(
      buildDecisionInput(
        decisionSchema.parse({ decision: 'approve', reason: null, note: '' }),
        true,
        true,
      ),
    ).toBeNull()
  })
  it('requires the explicit review acknowledgement, reason and ten-character justification', () => {
    expect(decisionSchema.safeParse(override).success).toBe(true)
    expect(decisionSchema.safeParse({ ...override, reviewedEvidence: false }).success).toBe(false)
    expect(decisionSchema.safeParse({ ...override, reason: null }).success).toBe(false)
    expect(decisionSchema.safeParse({ ...override, note: 'short' }).success).toBe(false)
  })
  it('includes manualOverride only when the operator selected the available override path', () => {
    expect(buildDecisionInput(decisionSchema.parse(override), true)).toMatchObject({
      decision: 'approve',
      manualOverride: true,
    })
    expect(buildDecisionInput(decisionSchema.parse(override), false)).toBeNull()
    const normal = buildDecisionInput(
      decisionSchema.parse({ decision: 'approve', reason: null, note: '' }),
      true,
    )
    expect(normal).toEqual({ decision: 'approve', reason: null, note: '' })
    expect(normal).not.toHaveProperty('manualOverride')
  })
  it('never submits the review checkbox itself as API data', () => {
    expect(buildDecisionInput(decisionSchema.parse(override), true)).not.toHaveProperty(
      'reviewedEvidence',
    )
  })
})
