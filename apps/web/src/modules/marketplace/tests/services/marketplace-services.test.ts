// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { AgencyProfileService } from '../../services/agency-profile-service'
import { BrokerProfileService } from '../../services/broker-profile-service'
import { MarketplaceService } from '../../services/marketplace-service'
import { ProfileMediaService } from '../../services/profile-media-service'
import { TenantAgentsService } from '../../services/tenant-agents-service'

function mockClient() {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }
}

let http: ReturnType<typeof mockClient>
const client = () => http as unknown as HttpClient

beforeEach(() => {
  http = mockClient()
})

describe('MarketplaceService', () => {
  it('sends only the filled search filters, the page included', async () => {
    const page = { properties: [], totalCount: 0, page: 2, pageSize: 10 }
    http.get.mockResolvedValue(page)

    await expect(
      new MarketplaceService(client()).searchProperties({
        purpose: 'RENT',
        location: '',
        hasParking: true,
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toBe(page)
    expect(http.get).toHaveBeenCalledWith('/marketplace/properties', {
      params: { purpose: 'RENT', hasParking: 'true', page: 2, pageSize: 10 },
    })
  })

  it('unwraps the property detail and the created inquiry', async () => {
    const service = new MarketplaceService(client())
    http.get.mockResolvedValue({ property: { id: 'p1' } })
    http.post.mockResolvedValue({ inquiry: { id: 'i1' } })

    await expect(service.getById('p1')).resolves.toEqual({ id: 'p1' })
    await expect(
      service.submitInquiry('p1', { leadName: 'Ana', leadEmail: 'ana@x.com' }),
    ).resolves.toEqual({ id: 'i1' })
    expect(http.post).toHaveBeenCalledWith('/marketplace/properties/p1/inquiries', {
      leadName: 'Ana',
      leadEmail: 'ana@x.com',
    })
  })
})

describe.each([
  {
    name: 'agency',
    Service: AgencyProfileService,
    publicPath: '/marketplace/agencies',
    ownPath: '/marketplace/profiles/agency',
    key: 'agency',
  },
  {
    name: 'broker',
    Service: BrokerProfileService,
    publicPath: '/marketplace/brokers',
    ownPath: '/marketplace/profiles/broker',
    key: 'broker',
  },
])('$name profile service', ({ Service, publicPath, ownPath, key }) => {
  const listKey = `${key === 'agency' ? 'agencies' : 'brokers'}`
  it('lists a page of public profiles with the search sent to the server', async () => {
    const page = { totalCount: 0, page: 1, pageSize: 12 }
    http.get.mockResolvedValue({ [listKey]: [], ...page })

    await expect(
      new Service(client()).list({ q: 'centro', page: 1, pageSize: 12 }),
    ).resolves.toEqual({ items: [], ...page })
    expect(http.get).toHaveBeenCalledWith(publicPath, {
      params: { q: 'centro', page: 1, pageSize: 12 },
    })
  })

  it('reads one public profile and the own profile, and saves and publishes the own one', async () => {
    const service = new Service(client())
    const profile = { id: 'x1' }
    http.get.mockResolvedValueOnce({ [key]: profile }).mockResolvedValueOnce({ profile: null })
    http.put.mockResolvedValue({ profile })
    http.post.mockResolvedValue({ profile })

    await expect(service.getById('x1')).resolves.toBe(profile)
    await expect(service.getOwn()).resolves.toBeNull()
    await expect(service.save({} as never)).resolves.toBe(profile)
    await expect(service.publish()).resolves.toBe(profile)
    await expect(service.unpublish()).resolves.toBe(profile)
    expect(http.get).toHaveBeenNthCalledWith(1, `${publicPath}/x1`)
    expect(http.put).toHaveBeenCalledWith(ownPath, {})
    expect(http.post).toHaveBeenNthCalledWith(1, `${ownPath}/publish`)
    expect(http.post).toHaveBeenNthCalledWith(2, `${ownPath}/unpublish`)
  })
})

describe('profile media and tenant agents', () => {
  it('uploads the image as multipart and returns its public URL', async () => {
    http.post.mockResolvedValue({ media: { url: '/api/marketplace/media/x.png' } })

    await expect(
      new ProfileMediaService(client()).upload(new File(['x'], 'x.png'), 'agency-logo'),
    ).resolves.toBe('/api/marketplace/media/x.png')
    const [, body] = http.post.mock.calls[0]
    expect((body as FormData).get('target')).toBe('agency-logo')
  })

  it('offers only active agents for the featured team', async () => {
    http.get.mockResolvedValue({
      users: [
        { id: 'a1', role: 'AGENT', active: true },
        { id: 'a2', role: 'AGENT', active: false },
        { id: 'o1', role: 'OWNER', active: true },
      ],
    })

    await expect(new TenantAgentsService(client()).list()).resolves.toEqual([
      { id: 'a1', role: 'AGENT', active: true },
    ])
  })
})
