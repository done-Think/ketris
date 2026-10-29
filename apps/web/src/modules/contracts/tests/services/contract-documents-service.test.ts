// @vitest-environment node
import axios, { type AxiosAdapter } from 'axios'
import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import { HttpClient } from '@shared/lib/api/http-client'
import { ContractDocumentsService } from '../../services/contract-documents-service'

const originalAdapter = axios.defaults.adapter
afterEach(() => {
  axios.defaults.adapter = originalAdapter
  vi.restoreAllMocks()
})

it('envia metadados à API e bytes ao storage sem encaminhar token ou tenant', async () => {
  const calls: {
    url?: string
    headers: Record<string, unknown>
    data: unknown
    withCredentials?: boolean
  }[] = []
  const file = new File(['%PDF-1.7 test'], 'Contrato final.pdf', { type: 'application/pdf' })
  const hash = createHash('sha256')
    .update(Buffer.from(await file.arrayBuffer()))
    .digest('hex')
  const adapter: AxiosAdapter = async (config) => {
    calls.push({
      url: config.url,
      headers: config.headers.toJSON(),
      data: config.data,
      withCredentials: config.withCredentials,
    })
    const data = config.url?.endsWith('/uploads')
      ? {
          uploadUrl: 'https://private-storage.example.test/upload',
          uploadToken: 'ticket',
          headers: { 'Content-Type': 'application/pdf', 'x-amz-checksum-sha256': 'checksum' },
        }
      : config.url === 'https://private-storage.example.test/upload'
        ? ''
        : { document: { id: 'document' } }
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  axios.defaults.adapter = adapter
  const api = new HttpClient('http://api.example.test')
  api.setAuthToken('secret-session-token')
  api.setTenant('agency')
  const service = new ContractDocumentsService(api)
  expect(await service.upload('contract', file, vi.fn())).toEqual({ id: 'document' })
  expect(calls).toHaveLength(3)
  expect(JSON.parse(String(calls[0].data))).toEqual({
    name: file.name,
    size: file.size,
    sha256: hash,
  })
  expect(calls[0].headers.Authorization).toBe('Bearer secret-session-token')
  expect(calls[1].headers).not.toHaveProperty('Authorization')
  expect(calls[1].headers).not.toHaveProperty('X-Tenant-Id')
  expect(calls[1].headers['Content-Type']).toBe('application/pdf')
  expect(calls[1].withCredentials).toBe(false)
  expect(calls[1].data).toBe(file)
  expect(JSON.parse(String(calls[2].data))).toEqual({ uploadToken: 'ticket' })
  expect(calls[2].headers.Authorization).toBe('Bearer secret-session-token')
})

it('não confirma o documento quando o envio dos bytes falha', async () => {
  const api = new HttpClient()
  const storage = new HttpClient('')
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    uploadUrl: 'https://private-storage.example.test/upload',
    uploadToken: 'ticket',
    headers: {},
  })
  vi.spyOn(storage, 'put').mockRejectedValue(new Error('Upload interrompido'))
  await expect(
    new ContractDocumentsService(api, storage).upload(
      'contract',
      new File(['%PDF-'], 'test.pdf'),
      vi.fn(),
    ),
  ).rejects.toThrow('Upload interrompido')
  expect(post).toHaveBeenCalledOnce()
})
