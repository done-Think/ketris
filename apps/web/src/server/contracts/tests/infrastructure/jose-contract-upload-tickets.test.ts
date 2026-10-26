// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { JoseContractUploadTickets } from '../../infrastructure/jose-contract-upload-tickets'
import { documentDescriptor } from '../fixtures/document'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('autorização temporária de envio de Contracts', () => {
  it('preserva os metadados e recusa qualquer adulteração do token', async () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', 'contracts-upload-tests-only')
    const tickets = new JoseContractUploadTickets()
    const token = await tickets.issue(documentDescriptor)
    expect(await tickets.verify(token)).toEqual(documentDescriptor)
    const parts = token.split('.')
    parts[1] = Buffer.from(
      JSON.stringify({ descriptor: { ...documentDescriptor, tenantId: 'other' } }),
    ).toString('base64url')
    await expect(tickets.verify(parts.join('.'))).rejects.toMatchObject({
      code: 'CONTRACT_UPLOAD_INVALID',
    })
  })

  it('expira em dez minutos sem aceitar tokens de outra finalidade', async () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', 'contracts-upload-tests-only')
    vi.useFakeTimers()
    const tickets = new JoseContractUploadTickets()
    const token = await tickets.issue(documentDescriptor)
    vi.advanceTimersByTime(600_000)
    await expect(tickets.verify(token)).rejects.toMatchObject({ code: 'CONTRACT_UPLOAD_EXPIRED' })
    const loginToken = await new SignJWT({ tenantId: 'agency', papel: 'OWNER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('manager')
      .setExpirationTime('10m')
      .sign(new TextEncoder().encode('contracts-upload-tests-only'))
    await expect(tickets.verify(loginToken)).rejects.toMatchObject({
      code: 'CONTRACT_UPLOAD_INVALID',
    })
  })

  it('falha com indisponibilidade quando não há segredo configurado', async () => {
    vi.stubEnv('AUTH_TOKEN_SECRET', '')
    const tickets = new JoseContractUploadTickets()
    await expect(tickets.issue(documentDescriptor)).rejects.toMatchObject({ status: 503 })
    await expect(tickets.verify('token')).rejects.toMatchObject({ status: 503 })
  })
})
