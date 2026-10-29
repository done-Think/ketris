import { describe, expect, it } from 'vitest'
import { AesContractDataProtector } from '../../infrastructure/aes-contract-data-protector'

const key = Buffer.alloc(32, 7).toString('base64')
const context = { tenantId: 'agency', partyId: 'party' }
const cpf = '529.982.247-25'

describe('proteção dos CPFs de Contracts', () => {
  it('preserva o valor ao descriptografar e usa um nonce novo em cada gravação', () => {
    const protector = new AesContractDataProtector(key)
    const first = protector.encryptCpf(cpf, context)
    const second = protector.encryptCpf(cpf, context)
    expect(first).not.toContain(cpf)
    expect(second).not.toBe(first)
    expect(protector.decryptCpf(first, context)).toBe(cpf)
    expect(protector.decryptCpf(second, context)).toBe(cpf)
  })

  it('recusa troca de tenant, parte, chave ou alteração do conteúdo criptografado', () => {
    const protector = new AesContractDataProtector(key)
    const encrypted = protector.encryptCpf(cpf, context)
    for (const other of [
      { ...context, tenantId: 'other' },
      { ...context, partyId: 'other' },
    ])
      expect(() => protector.decryptCpf(encrypted, other)).toThrow()
    expect(() =>
      new AesContractDataProtector(Buffer.alloc(32, 9).toString('base64')).decryptCpf(
        encrypted,
        context,
      ),
    ).toThrow()
    const parts = encrypted.split(':')
    parts[4] = Buffer.alloc(10, 3).toString('base64url')
    expect(() => protector.decryptCpf(parts.join(':'), context)).toThrow()
  })

  it('bloqueia novas gravações com chave inválida sem expor dados sensíveis no erro', () => {
    expect(() => new AesContractDataProtector('short').encryptCpf(cpf, context)).toThrow(
      'Não foi possível acessar a proteção',
    )
    try {
      new AesContractDataProtector('short').encryptCpf(cpf, context)
    } catch (error) {
      expect(String(error)).not.toContain(cpf)
      expect(error).toMatchObject({ status: 503, code: 'CONTRACT_DATA_PROTECTION_UNAVAILABLE' })
    }
  })

  it('permite leitura dos legados durante a migração sem atribuir proteção inexistente', () => {
    expect(new AesContractDataProtector('short').decryptCpf(cpf, context)).toBe(cpf)
  })
})
