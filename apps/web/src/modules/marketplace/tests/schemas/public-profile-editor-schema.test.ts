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

  it('rejects incomplete or excessive team members', () => {
    const incompleteResult = publicProfileEditorSchema.safeParse({
      ...publicProfileEditorDefaultValues,
      teamMembers: [
        {
          name: '',
          role: '',
          avatarUrl: 'not-a-url',
          profileUrl: '',
        },
      ],
    })
    const excessiveResult = publicProfileEditorSchema.safeParse({
      ...publicProfileEditorDefaultValues,
      teamMembers: Array.from({ length: 7 }, (_, index) => ({
        name: `Membro ${index + 1}`,
        role: 'Corretor',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileUrl: `/brokers/membro-${index + 1}`,
      })),
    })

    expect(incompleteResult.success).toBe(false)
    expect(excessiveResult.success).toBe(false)
  })
})
