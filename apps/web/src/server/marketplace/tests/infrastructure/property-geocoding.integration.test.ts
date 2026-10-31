import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { NominatimAddressGeocoder } from '@server/shared/location/nominatim-address-geocoder'
import { PostgresRateLimitStore } from '@server/security/postgres-rate-limit-store'
import { CreatePropertyUseCase } from '@server/properties/application/use-cases/create-property.use-case'
import { UpdatePropertyUseCase } from '@server/properties/application/use-cases/update-property.use-case'
import { PrismaPropertyRepository } from '@server/properties/infrastructure/prisma-property.repository'
import { PrismaPublishedPropertyLocationRepository } from '../../infrastructure/prisma-published-property-location.repository'
import { PrismaPublicPropertyRepository } from '../../infrastructure/prisma-public-property.repository'
import { ResolvePublishedPropertyLocationsUseCase } from '../../application/use-cases/resolve-published-property-locations.use-case'
import { SearchPropertiesUseCase } from '../../application/use-cases/search-properties.use-case'
import { GetPropertyUseCase } from '../../application/use-cases/get-property.use-case'

const address = {
  street: 'Rua das Flores',
  number: '10',
  complement: null,
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
  zipCode: '80000000',
  latitude: null,
  longitude: null,
}
const coordinates = { latitude: -25.4, longitude: -49.2 }
const repository = new PrismaPublishedPropertyLocationRepository()
const publicProperties = new PrismaPublicPropertyRepository()
const properties = new PrismaPropertyRepository()

describe('property address geocoding persistence', () => {
  let tenantId: string
  let actorId: string
  const token = `geocoding-${randomUUID()}`
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { name: token, slug: token } })
    tenantId = tenant.id
    actorId = (
      await prisma.user.create({
        data: {
          tenantId,
          name: token,
          email: `${token}@example.test`,
          passwordHash: 'unused',
          role: 'AGENT',
        },
      })
    ).id
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })
  function createPublished(status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') {
    return prisma.property.create({
      data: {
        tenantId,
        responsibleId: actorId,
        title: token,
        type: 'HOUSE',
        purpose: 'SALE',
        price: 450000,
        status,
        address: { create: address },
      },
    })
  }
  function locations() {
    const geocoder = { locate: vi.fn().mockResolvedValue(coordinates) }
    return {
      geocoder,
      resolver: new ResolvePublishedPropertyLocationsUseCase(repository, geocoder),
    }
  }

  it('creates and updates a property from its address without coordinates in the form', async () => {
    const response = {
      lat: String(coordinates.latitude),
      lon: String(coordinates.longitude),
      address: {
        road: address.street,
        house_number: address.number,
        city: address.city,
        state: 'Paraná',
        'ISO3166-2-lvl4': 'BR-PR',
        country_code: 'br',
      },
    }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([response])))
    vi.stubGlobal('fetch', fetch)
    const geocoder = new NominatimAddressGeocoder(
      'https://geocoder.example/search',
      'Ketris-test',
      { consume: vi.fn().mockResolvedValue({ allowed: true }) },
    )
    const owners = { findActiveOwner: vi.fn(), listActiveOwners: vi.fn() }
    const created = await new CreatePropertyUseCase(properties, owners, geocoder).execute({
      actorTenantId: tenantId,
      actorUserId: actorId,
      actorRole: 'AGENT',
      title: token,
      type: 'HOUSE',
      purpose: 'SALE',
      price: 450000,
      address,
    })
    expect(created.address).toMatchObject(coordinates)
    expect(
      (
        await prisma.propertyAddress.findUniqueOrThrow({ where: { propertyId: created.id } })
      ).latitude?.toNumber(),
    ).toBe(coordinates.latitude)

    const updatedCoordinates = { latitude: -25.41, longitude: -49.21 }
    const updated = await new UpdatePropertyUseCase(properties, owners, {
      locate: vi.fn().mockResolvedValue(updatedCoordinates),
    }).execute({
      actorTenantId: tenantId,
      actorId,
      actorRole: 'AGENT',
      id: created.id,
      address: { ...address, street: 'Rua Nova' },
    })
    expect(updated.address).toMatchObject({ street: 'Rua Nova', ...updatedCoordinates })
  })

  it('repairs a previously published address on search and reuses saved coordinates on detail', async () => {
    const property = await createPublished()
    const { resolver, geocoder } = locations()
    // Isolate this result set while retaining the actual search SQL and pagination.
    const search = new SearchPropertiesUseCase(publicProperties, resolver)
    const result = await search.execute({
      q: token,
      page: 1,
      pageSize: 100,
      latitude: -25.4,
      longitude: -49.2,
    })
    expect(result.items.find(({ id }) => id === property.id)).toMatchObject(coordinates)
    geocoder.locate.mockClear()
    const detail = await new GetPropertyUseCase(publicProperties, geocoder, resolver).execute({
      propertyId: property.id,
    })
    expect(detail.address).toMatchObject(coordinates)
    expect(geocoder.locate).not.toHaveBeenCalled()
    expect(detail).not.toHaveProperty('tenantId')
  })

  it('does not locate drafts or properties outside the requested result IDs', async () => {
    const draft = await createPublished('DRAFT')
    await createPublished()
    expect(await repository.findCandidates([draft.id], 3)).toEqual([])
  })

  it('keeps unknown locations empty and backs off before the next attempt', async () => {
    const property = await createPublished()
    const [candidate] = await repository.findCandidates([property.id], 1)
    await repository.saveResult(candidate, null)
    const row = await prisma.propertyAddress.findUniqueOrThrow({
      where: { propertyId: property.id },
    })
    expect(row.latitude).toBeNull()
    expect(row.geocodingRetryAt!.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000)
    expect(await repository.findCandidates([property.id], 1)).toEqual([])
    await prisma.propertyAddress.update({
      where: { propertyId: property.id },
      data: { geocodingRetryAt: new Date(Date.now() - 1000) },
    })
    expect(await repository.findCandidates([property.id], 1)).toHaveLength(1)
  })

  it('rejects a stale geocoder response when the address is edited during the lookup', async () => {
    const property = await createPublished()
    const [candidate] = await repository.findCandidates([property.id], 1)
    await prisma.propertyAddress.update({
      where: { propertyId: property.id },
      data: { street: 'Rua Nova', updatedAt: candidate.updatedAt },
    })
    expect(await repository.saveResult(candidate, coordinates)).toBe(false)
    expect((await publicProperties.findPublishedById(property.id))?.address).toMatchObject({
      street: 'Rua Nova',
      latitude: null,
      longitude: null,
    })
  })

  it('does not overwrite coordinates another request has already saved', async () => {
    const property = await createPublished()
    const [candidate] = await repository.findCandidates([property.id], 1)
    const newer = { latitude: -25.42, longitude: -49.25 }
    await prisma.propertyAddress.update({ where: { propertyId: property.id }, data: newer })
    expect(await repository.saveResult(candidate, coordinates)).toBe(false)
    expect(await publicProperties.findPublishedById(property.id)).toMatchObject(newer)
  })

  it('does not save a lookup after the property is withdrawn', async () => {
    const property = await createPublished()
    const [candidate] = await repository.findCandidates([property.id], 1)
    await prisma.property.update({ where: { id: property.id }, data: { status: 'INACTIVE' } })
    expect(await repository.saveResult(candidate, coordinates)).toBe(false)
  })

  it('shares the provider quota between independent workers instead of allowing parallel external requests', async () => {
    const startedAt: number[] = []
    const fetch = vi.fn().mockImplementation(async () => {
      startedAt.push(Date.now())
      return new Response(
        JSON.stringify([
          {
            lat: '-25.4',
            lon: '-49.2',
            address: {
              road: address.street,
              house_number: '10',
              city: 'Curitiba',
              'ISO3166-2-lvl4': 'BR-PR',
              country_code: 'br',
            },
          },
        ]),
      )
    })
    vi.stubGlobal('fetch', fetch)
    const worker = () =>
      new NominatimAddressGeocoder(
        'https://geocoder.example/search',
        'Ketris-test',
        new PostgresRateLimitStore(),
      )
    await Promise.all([worker().locate(address), worker().locate(address)])
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(startedAt[1] - startedAt[0]).toBeGreaterThanOrEqual(1100)
    const bucket = await prisma.authRateLimitBucket.findUniqueOrThrow({
      where: { key: 'address-geocoding:application' },
    })
    expect(bucket.count).toBe(1)
  })
})
