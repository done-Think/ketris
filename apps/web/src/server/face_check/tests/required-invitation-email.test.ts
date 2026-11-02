// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSessionBodySchema } from '../schemas/api.schemas'
import { createInput, verificationHarness } from './fixtures/verification-harness'

describe('mandatory verification invitation email', () => {
  it.each([undefined, null, '', '   ', '35999999999', 'invalid@', 'person name'])(
    'rejects invalid email at the API boundary: %s',
    (contact) => {
      expect(createSessionBodySchema.safeParse({ ...createInput, contact }).success).toBe(false)
    },
  )

  it.each(['', '35999999999', 'invalid@'])(
    'does not persist a verification when the application receives an invalid email: %s',
    async (contact) => {
      const h = verificationHarness()
      await expect(
        h.cases.createSessionUseCase.execute({ ...createInput, contact }),
      ).rejects.toThrow()
      expect(await h.sessions.list()).toHaveLength(0)
    },
  )

  it('normalizes the email used for candidate association and invitation delivery', async () => {
    const h = verificationHarness()
    const session = await h.cases.createSessionUseCase.execute({
      ...createInput,
      contact: '  Candidate@Example.test  ',
    })
    expect(session.contact).toBe('candidate@example.test')
  })
})
