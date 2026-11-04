import { prisma } from '@server/db/prisma'
import type { AddressCoordinates } from '@server/shared/location/address-geocoder.port'
import type {
  PropertyLocationCandidate,
  PublishedPropertyLocationRepository,
} from '../application/ports/published-property-location-repository.port'

export class PrismaPublishedPropertyLocationRepository implements PublishedPropertyLocationRepository {
  async findCandidates(propertyIds: string[], limit: number): Promise<PropertyLocationCandidate[]> {
    const rows = await prisma.propertyAddress.findMany({
      where: {
        propertyId: { in: propertyIds },
        property: { status: 'PUBLISHED' },
        AND: [
          { OR: [{ latitude: null }, { longitude: null }] },
          { OR: [{ geocodingRetryAt: null }, { geocodingRetryAt: { lte: new Date() } }] },
        ],
      },
      orderBy: [{ geocodingRetryAt: 'asc' }, { propertyId: 'asc' }],
      take: limit,
    })
    return rows.map((row) => ({
      propertyId: row.propertyId,
      updatedAt: row.updatedAt,
      address: {
        street: row.street,
        number: row.number,
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        latitude: row.latitude?.toNumber() ?? null,
        longitude: row.longitude?.toNumber() ?? null,
      },
    }))
  }

  async saveResult(
    candidate: PropertyLocationCandidate,
    coordinates: AddressCoordinates | null,
  ): Promise<boolean> {
    const { count } = await prisma.propertyAddress.updateMany({
      where: {
        propertyId: candidate.propertyId,
        updatedAt: candidate.updatedAt,
        street: candidate.address.street,
        number: candidate.address.number,
        neighborhood: candidate.address.neighborhood,
        city: candidate.address.city,
        state: candidate.address.state,
        zipCode: candidate.address.zipCode,
        property: { status: 'PUBLISHED' },
        OR: [{ latitude: null }, { longitude: null }],
      },
      data: {
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        geocodingRetryAt: coordinates ? null : new Date(Date.now() + 15 * 60_000),
      },
    })
    return count > 0
  }
}
