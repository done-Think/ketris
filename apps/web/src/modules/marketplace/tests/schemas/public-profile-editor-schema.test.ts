import { describe, expect, it } from 'vitest'

import { publicProfileEditorDefaultValues } from '../../data/public-profile-editor'
import { publicProfileEditorSchema } from '../../schemas/public-profile-editor-schema'

describe('publicProfileEditorSchema', () => {
  it('accepts the default broker public profile draft', () => {
    expect(publicProfileEditorSchema.safeParse(publicProfileEditorDefaultValues).success).toBe(true)
  })

  it('rejects duplicated visible sections and invalid colors', () => {
    const result = publicProfileEditorSchema.safeParse({
      ...publicProfileEditorDefaultValues,
      primaryColor: 'magenta',
      sectionOrder: ['hero', 'hero', 'metrics', 'contact', 'listings'],
    })

    expect(result.success).toBe(false)
  })
})
