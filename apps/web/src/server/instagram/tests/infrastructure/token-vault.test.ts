import { configureInstagramTestEnv } from '../fixtures/environment'
import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EncryptedInstagramTokenVault } from '../../infrastructure/token-vault'
import { instagramTokenContext } from '../../domain/token-context'
import { connection } from '../fixtures/instagram'
import {
  verifyInstagramSignedRequest,
  deletionReceipt,
  verifyDeletionReceipt,
} from '../../http/signed-request'

beforeEach(configureInstagramTestEnv)
afterEach(() => vi.unstubAllEnvs())

describe('Instagram token and callback protection', () => {
  it('binds the token to the tenant, connection owner and destination account', () => {
    const vault = new EncryptedInstagramTokenVault()
    const owner = connection()
    const context = instagramTokenContext(owner)
    const ciphertext = vault.encrypt('personal-token', context)
    expect(vault.decrypt(ciphertext, context)).toBe('personal-token')
    for (const changed of [
      { ...owner, tenantId: 'other-tenant' },
      { ...owner, connectedBy: 'other-user' },
      { ...owner, accountId: 'other-account' },
    ])
      expect(() => vault.decrypt(ciphertext, instagramTokenContext(changed))).toThrow()
    expect(() => vault.decrypt(ciphertext.replace(/^v2\./, 'v1.'), context)).toThrow()
  })
  it('encrypts with randomized IVs and tenant-bound authenticated encryption', () => {
    const vault = new EncryptedInstagramTokenVault()
    const ciphertext = vault.encrypt('secret-token', 'tenant-a')
    expect(ciphertext).not.toContain('secret-token')
    expect(ciphertext).not.toBe(vault.encrypt('secret-token', 'tenant-a'))
    expect(vault.decrypt(ciphertext, 'tenant-a')).toBe('secret-token')
    expect(() => vault.decrypt(ciphertext, 'tenant-b')).toThrow()
    expect(() => vault.decrypt(`${ciphertext}x`, 'tenant-a')).toThrow()
  })
  it('validates Meta signed requests and rejects forged or stale callbacks', () => {
    const payload = Buffer.from(
      JSON.stringify({
        algorithm: 'HMAC-SHA256',
        user_id: '456',
        issued_at: Math.floor(Date.now() / 1000),
      }),
    ).toString('base64url')
    const signature = createHmac('sha256', 'test-app-secret').update(payload).digest('base64url')
    expect(verifyInstagramSignedRequest(`${signature}.${payload}`)).toBe('456')
    expect(() => verifyInstagramSignedRequest(`forged.${payload}`)).toThrow()
    const old = Buffer.from(
      JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '456', issued_at: 1 }),
    ).toString('base64url')
    expect(() =>
      verifyInstagramSignedRequest(
        `${createHmac('sha256', 'test-app-secret').update(old).digest('base64url')}.${old}`,
      ),
    ).toThrow()
  })
  it('returns a tamper-proof deletion receipt without an account ID', () => {
    const code = 'c7d71430-964b-41e4-a8bd-f32bbd4bb11b'
    const receipt = deletionReceipt(code, new Date().toISOString())
    expect(verifyDeletionReceipt(receipt).code).toBe(code)
    expect(() => verifyDeletionReceipt(`${receipt}x`)).toThrow()
  })
})
