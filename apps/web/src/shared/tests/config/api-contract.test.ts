import { describe, expect, it } from 'vitest'

import { requiresApiContract } from '@shared/config/api-contract'

describe('requiresApiContract', () => {
  it.each([
    '/api/internal/face_check/cleanup',
    '/api/internal/face_check/invitations',
    '/api/internal/face_check/analysis',
    '/api/internal/face_check/analysis/',
  ])('exempts the Face Check worker endpoint %s', (path) => {
    expect(requiresApiContract(path)).toBe(false)
  })

  it.each(['/api/properties', '/api/internal/other', '/api/auth/me'])(
    'still requires the contract on %s',
    (path) => {
      expect(requiresApiContract(path)).toBe(true)
    },
  )
})
