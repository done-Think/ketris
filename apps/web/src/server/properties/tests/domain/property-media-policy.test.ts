import { describe, expect, it } from 'vitest'

import { assertPropertyMediaScope } from '../../domain/property-media-policy'

describe('property media scope', () => {
  it('accepts only uploads from the actor tenant for new media', () => {
    expect(() =>
      assertPropertyMediaScope('tenant-1', [
        { url: '/api/properties/media/properties/tenant-1/photo.jpg' },
      ]),
    ).not.toThrow()
  })
  it.each([
    'https://example.test/photo.jpg',
    '/api/properties/media/properties/tenant-2/photo.jpg',
    '/api/properties/media/properties/tenant-1/../private.jpg',
    '/api/properties/media/properties/tenant-1/%2e%2e.jpg',
    '/api/maintenance/media/private.jpg',
  ])('rejects a new reference outside the tenant: %s', (url) => {
    expect(() => assertPropertyMediaScope('tenant-1', [{ url }])).toThrow(
      'A mídia deve ser um upload do mesmo tenant.',
    )
  })
  it('preserves legacy URLs only if they already belong to the property being edited', () => {
    const legacy = 'https://legacy.example.test/existing.jpg'
    expect(() => assertPropertyMediaScope('tenant-1', [{ url: legacy }], [legacy])).not.toThrow()
    expect(() =>
      assertPropertyMediaScope(
        'tenant-1',
        [{ url: 'https://legacy.example.test/new.jpg' }],
        [legacy],
      ),
    ).toThrow()
  })
})
