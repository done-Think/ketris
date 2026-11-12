import { AxiosError, AxiosHeaders } from 'axios'
import { expect, it, vi } from 'vitest'
import { contractError } from '../../utils/contract-error'

function apiError(code: string) {
  return new AxiosError('fail', 'ERR', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { error: { code } },
  })
}

it('traduz a conta de dono de imóvel não encontrada no vínculo do locador', () => {
  const t = vi.fn((key: string) => `msg:${key}`)
  expect(contractError(apiError('CONTRACT_LANDLORD_USER_NOT_FOUND'), t)).toBe(
    'msg:CONTRACT_LANDLORD_USER_NOT_FOUND',
  )
  expect(contractError(apiError('CODIGO_DESCONHECIDO'), t)).toBe('msg:generic')
})
