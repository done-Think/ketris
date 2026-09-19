import { describe, expect, it } from 'vitest'

import { registrationDetailsSchema } from './registration-details-schema'

const validDetails = {
  profile: 'proprietario' as const,
  fullName: 'Maria da Silva',
  email: 'MARIA@EMAIL.COM',
  phone: '(11) 99999-9999',
  password: 'senha-segura',
  passwordConfirmation: 'senha-segura',
  creci: '',
  acceptTerms: true,
}

describe('registrationDetailsSchema', () => {
  it('aceita os dados de um proprietário e normaliza o e-mail', () => {
    const result = registrationDetailsSchema.parse(validDetails)

    expect(result.email).toBe('maria@email.com')
  })

  it('exige CRECI para o perfil corretor', () => {
    const result = registrationDetailsSchema.safeParse({ ...validDetails, profile: 'corretor' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.creci).toContain('Informe seu CRECI')
    }
  })

  it('aceita companyName e agencyId opcionais só no perfil corretor', () => {
    const withAgency = registrationDetailsSchema.safeParse({
      ...validDetails,
      profile: 'corretor',
      creci: '00000-F',
      agencyId: 'agency-1',
      companyName: 'Minha Corretora',
    })

    expect(withAgency.success).toBe(true)
  })

  it('aceita corretor autônomo, sem agencyId', () => {
    const autonomous = registrationDetailsSchema.safeParse({
      ...validDetails,
      profile: 'corretor',
      creci: '00000-F',
    })

    expect(autonomous.success).toBe(true)
    if (autonomous.success && autonomous.data.profile === 'corretor') {
      expect(autonomous.data.agencyId).toBeUndefined()
    }
  })

  it('rejeita senhas diferentes e termos não aceitos', () => {
    const result = registrationDetailsSchema.safeParse({
      ...validDetails,
      passwordConfirmation: 'outra-senha',
      acceptTerms: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.passwordConfirmation).toContain(
        'As senhas não coincidem',
      )
      expect(result.error.flatten().fieldErrors.acceptTerms).toContain(
        'Aceite os termos para continuar',
      )
    }
  })
})
