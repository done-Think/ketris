import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/properties/route'
import { PATCH } from '@/app/api/properties/[id]/route'
import { GET as listBrokers } from '@/app/api/properties/brokers/route'

const { create, update, list } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
}))
vi.mock('@server/auth/container', () => ({ authContainer: { tokenService: {} } }))
vi.mock('@server/auth/require-bearer-auth', () => ({
  requireBearerAuth: async () => ({ sub: 'manager', tenantId: 'agency', role: 'OWNER' }),
}))
vi.mock('@server/properties/container', () => ({
  propertiesContainer: {
    createPropertyUseCase: { execute: create },
    updatePropertyUseCase: { execute: update },
    listPropertyBrokersUseCase: { execute: list },
  },
}))

function request(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/properties', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  create.mockResolvedValue({ id: 'property' })
  update.mockResolvedValue({ id: 'property' })
  list.mockResolvedValue({
    brokers: [],
    pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
  })
})

describe('property broker grant HTTP transport', () => {
  it('passes multiple broker grants and server-authenticated agency identity to creation', async () => {
    const response = await POST(
      request('POST', {
        title: 'House',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 1000,
        brokerIds: ['broker-a', 'broker-b'],
        tenantId: 'forged-agency',
      }),
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorTenantId: 'agency',
        actorUserId: 'manager',
        brokerIds: ['broker-a', 'broker-b'],
      }),
    )
  })

  it('distinguishes omitted grants from explicit revocation in PATCH', async () => {
    const context = { params: Promise.resolve({ id: 'property' }) }
    expect((await PATCH(request('PATCH', { brokerIds: [] }), context)).status).toBe(200)
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ brokerIds: [] }))
    expect((await PATCH(request('PATCH', { title: 'Updated house' }), context)).status).toBe(200)
    expect(update.mock.calls.at(-1)?.[0]).not.toHaveProperty('brokerIds')
  })

  it('ignores forged agency selectors when loading the broker directory', async () => {
    expect(
      (
        await listBrokers(
          new NextRequest('http://localhost/api/properties/brokers?tenantId=forged'),
        )
      ).status,
    ).toBe(200)
    expect(list).toHaveBeenCalledWith({
      actorTenantId: 'agency',
      actorRole: 'OWNER',
      page: 1,
      pageSize: 100,
    })
  })
})
