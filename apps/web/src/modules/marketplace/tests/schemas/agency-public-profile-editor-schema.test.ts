import { describe, expect, it } from 'vitest'

import { agencyPublicProfileEditorDefaultValues } from '../../data/agency-public-profile-editor'
import { agencyPublicProfileEditorSchema } from '../../schemas/agency-public-profile-editor-schema'

describe('agencyPublicProfileEditorSchema', () => {
  it('accepts the default agency public profile draft', () => {
    expect(
      agencyPublicProfileEditorSchema.safeParse(agencyPublicProfileEditorDefaultValues).success,
    ).toBe(true)
  })

  it('rejects duplicated visible sections and invalid urls', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({
      ...agencyPublicProfileEditorDefaultValues,
      bannerUrl: 'banner-local',
      sectionOrder: ['brand', 'metrics', 'metrics', 'team', 'listings'],
    })

    expect(result.success).toBe(false)
  })
})
