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

  it.each([
    '/api/instagram/oauth/callback',
    '/api/instagram/deauthorize',
    '/api/instagram/data-deletion',
    '/api/instagram/deletion-status',
    '/api/instagram/media/publication-1/0',
    '/api/cron/instagram',
  ])('lets Meta, the browser and the scheduler reach %s without the contract header', (path) => {
    expect(requiresApiContract(path)).toBe(false)
  })

  it.each([
    '/api/instagram/connection',
    '/api/instagram/oauth/start',
    '/api/instagram/oauth/callback/extra',
    '/api/instagram/properties/property-1/publications',
    '/api/instagram/publications/publication-1/retry',
  ])('keeps the contract header on app route %s', (path) => {
    expect(requiresApiContract(path)).toBe(true)
  })
})
