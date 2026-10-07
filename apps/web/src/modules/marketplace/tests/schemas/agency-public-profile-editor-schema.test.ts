import { describe, expect, it } from 'vitest'

import { createAgencyPublicProfileEditorSchema } from '../../schemas/agency-public-profile-editor-schema'

const agencyPublicProfileEditorSchema = createAgencyPublicProfileEditorSchema((key) => key)

const validDraft = {
  displayName: 'Imobiliária Horizonte',
  headline: '',
  summary: 'A imobiliária mais completa da cidade.',
  legalCreci: 'CRECI J-38210',
  headquarters: 'Jardins, São Paulo',
  address: 'Alameda Santos, 1320',
  phone: '(11) 3042-9000',
  email: 'contato@horizonte.com.br',
  coverage: 'Jardins, Itaim Bibi',
  segments: 'Residencial, Alto padrão',
  yearsInMarket: '14',
  backgroundColor: '#FFFFFF',
  logoUrl: '',
  bannerUrl: '',
  team: [{ usuarioId: 'usuario-1', name: 'Marina Costa' }],
}

describe('agencyPublicProfileEditorSchema', () => {
  it('aceita um rascunho válido', () => {
    expect(agencyPublicProfileEditorSchema.safeParse(validDraft).success).toBe(true)
  })

  it('aceita caminhos internos retornados pelo upload de imagens', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({
      ...validDraft,
      logoUrl: '/api/marketplace/media/profiles/agencies/tenant-1/logo-uuid-logo.webp',
      bannerUrl: '/api/marketplace/media/profiles/agencies/tenant-1/banner-uuid-banner.webp',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita nome da imobiliária vazio', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({ ...validDraft, displayName: '' })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail em formato inválido', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({
      ...validDraft,
      email: 'não-é-email',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita URL de banner inválida', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({
      ...validDraft,
      bannerUrl: 'banner-local',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita mais de 6 corretores destacados', () => {
    const result = agencyPublicProfileEditorSchema.safeParse({
      ...validDraft,
      team: Array.from({ length: 7 }, (_, index) => ({
        usuarioId: `usuario-${index}`,
        name: `Corretor ${index}`,
      })),
    })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createAgencyPublicProfileEditorSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ ...validDraft, displayName: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:displayNameRequired',
    )
  })
})
