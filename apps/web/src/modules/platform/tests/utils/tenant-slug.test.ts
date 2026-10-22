import { describe, expect, it } from 'vitest'

import { slugifyTenantName } from '../../utils/tenant-slug'

describe('slugifyTenantName', () => {
  it('remove acentos, troca símbolos e espaços por hífen e usa minúsculas', () => {
    expect(slugifyTenantName('Imobiliária São João & Filhos')).toBe('imobiliaria-sao-joao-filhos')
    expect(slugifyTenantName('  ACME   Imóveis  ')).toBe('acme-imoveis')
    expect(slugifyTenantName('Casa 123 -- Ltda.')).toBe('casa-123-ltda')
  })

  it('retorna vazio quando não sobra nenhuma letra ou número', () => {
    expect(slugifyTenantName('')).toBe('')
    expect(slugifyTenantName('!!!')).toBe('')
  })
})
