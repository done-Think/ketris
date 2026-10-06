import { describe, expect, it } from 'vitest'

import { createPublicProfileEditorSchema } from '../../schemas/public-profile-editor-schema'

const publicProfileEditorSchema = createPublicProfileEditorSchema((key) => key)

const validDraft = {
  displayName: 'Marina Costa',
  headline: '',
  bio: 'Corretora há 10 anos, focada em alto padrão.',
  creci: '12345-F',
  phone: '(11) 90000-0000',
  region: 'Jardins, São Paulo',
  neighborhoods: 'Jardins, Itaim Bibi',
  specialties: 'Alto padrão, Aluguel',
  availability: 'Segunda a sexta, 9h às 18h',
  primaryColor: '#F30274',
  secondaryColor: '#212631',
  backgroundColor: '#FFFFFF',
  avatarUrl: '',
  bannerUrl: '',
}

describe('publicProfileEditorSchema', () => {
  it('aceita um rascunho válido', () => {
    expect(publicProfileEditorSchema.safeParse(validDraft).success).toBe(true)
  })

  it('aceita campos opcionais em branco', () => {
    const result = publicProfileEditorSchema.safeParse({
      ...validDraft,
      headline: '',
      bio: '',
      creci: '',
      phone: '',
      region: '',
      neighborhoods: '',
      specialties: '',
      availability: '',
      primaryColor: '',
      secondaryColor: '',
      backgroundColor: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita nome exibido vazio', () => {
    const result = publicProfileEditorSchema.safeParse({ ...validDraft, displayName: '' })

    expect(result.success).toBe(false)
  })

  it('rejeita cor em formato inválido', () => {
    const result = publicProfileEditorSchema.safeParse({ ...validDraft, primaryColor: 'magenta' })

    expect(result.success).toBe(false)
  })

  it('rejeita URL inválida para avatar/banner', () => {
    const result = publicProfileEditorSchema.safeParse({ ...validDraft, avatarUrl: 'not-a-url' })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createPublicProfileEditorSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ ...validDraft, displayName: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:displayNameRequired',
    )
  })
})
