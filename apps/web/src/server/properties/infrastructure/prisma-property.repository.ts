import { resolveMutationAuthor } from '@server/shared/persistence/mutation-author'
import { matchingPropertyTypes } from '../domain/property-search'
import { findPropertyIdsInDisplayOrder } from './property-display-order'
import type {
  PropertyAddress as PrismaPropertyAddress,
  PropertyPurpose,
  Prisma,
  PropertyStatus as PrismaPropertyStatus,
} from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PropertyRepository } from '../application/ports/property-repository.port'
import type {
  ActiveContractProperty,
  NewProperty,
  Property,
  PropertyPage,
  PropertyAddress,
  PropertyChanges,
  PropertyListFilters,
  PropertyMediaInput,
  PropertyStatus,
  RentedProperty,
} from '../types/property'
import type { PropertyRow, PropertyTransaction } from '../types/prisma-property-repository'

const propertyInclude = {
  responsible: { select: { name: true } },
  ownerContact: { select: { id: true, name: true } },
  contracts: {
    where: { status: 'ACTIVE' as const },
    select: { id: true },
    take: 1,
    orderBy: { updatedAt: 'desc' as const },
  },
  address: true,
  media: { orderBy: { position: 'asc' as const } },
}

function renterPropertyScope(tenantId: string, renterId?: string): Prisma.PropertyWhereInput {
  return renterId === undefined
    ? {}
    : {
        contracts: {
          some: {
            tenantId,
            status: 'ACTIVE',
            parties: { some: { role: 'RENTER', userId: renterId } },
          },
        },
      }
}

function propertySearchWhere(search?: string): Prisma.PropertyWhereInput {
  if (!search) return {}
  const matchingTypes = matchingPropertyTypes(search)
  const parts = search.split(',').map((part) => part.trim())
  return {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { type: { in: matchingTypes } },
      {
        address: {
          is: {
            OR: [
              { street: { contains: search, mode: 'insensitive' } },
              { number: { contains: search } },
              { neighborhood: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              ...(parts.length === 2
                ? [
                    {
                      AND: [
                        { street: { contains: parts[0], mode: 'insensitive' as const } },
                        { number: { contains: parts[1] } },
                      ],
                    },
                    {
                      AND: [
                        { neighborhood: { contains: parts[0], mode: 'insensitive' as const } },
                        { city: { contains: parts[1], mode: 'insensitive' as const } },
                      ],
                    },
                  ]
                : []),
            ],
          },
        },
      },
      { responsible: { name: { contains: search, mode: 'insensitive' } } },
    ],
  }
}

export class PrismaPropertyRepository implements PropertyRepository {
  async create(property: NewProperty, actorId?: string): Promise<Property> {
    const authorId = await resolveMutationAuthor(prisma, property.tenantId, actorId)
    return prisma.property
      .create({
        data: {
          tenantId: property.tenantId,
          updatedById: authorId,
          responsibleId: property.responsibleId,
          ownerId: property.ownerId ?? null,
          ownerContactId: property.ownerContactId ?? null,
          title: property.title,
          description: property.description ?? null,
          purpose: property.purpose,
          type: property.type,
          amenities: property.listing?.amenities ?? [],
          negotiationTerms: property.listing?.negotiationTerms ?? null,
          publishAfterReview: property.listing?.publishAfterReview ?? false,
          allowWhatsappContact: property.listing?.allowWhatsappContact ?? false,
          featured: property.listing?.featured ?? false,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          parkingSpots: property.parkingSpots ?? null,
          areaSqm: property.areaSqm ?? null,
          price: property.price,
          rentalPrice: property.rentalPrice ?? null,
          condoFee: property.condoFee ?? null,
          propertyTax: property.propertyTax ?? null,
          status: 'DRAFT',
          address: property.address ? { create: toAddressData(property.address) } : undefined,
          media: toMediaCreateInput(property.media),
        },
        include: propertyInclude,
      })
      .then(mapProperty)
  }

  listPage(filters: PropertyListFilters): Promise<PropertyPage> {
    const scope: Prisma.PropertyWhereInput = {
      tenantId: filters.tenantId,
      purpose: filters.purpose,
      responsibleId: filters.responsibleId,
      ownerId: filters.ownerId,
      ...renterPropertyScope(filters.tenantId, filters.renterId),
    }
    const where: Prisma.PropertyWhereInput = {
      ...scope,
      status: filters.status,
      ...propertySearchWhere(filters.search),
    }
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 25
    return prisma.$transaction(
      async (transaction) => {
        const direction = filters.sortOrder ?? 'desc'
        const sortBy = filters.sortBy ?? 'updatedAt'
        const orderBy: Prisma.PropertyOrderByWithRelationInput =
          sortBy === 'title'
            ? { title: direction }
            : sortBy === 'type'
              ? { type: direction }
              : sortBy === 'status'
                ? { status: direction }
                : sortBy === 'broker'
                  ? { responsible: { name: direction } }
                  : { updatedAt: direction }
        const customSort = ['saleValue', 'rentalValue', 'type', 'status'].includes(sortBy)
        const orderedIds = customSort
          ? await findPropertyIdsInDisplayOrder(transaction, filters)
          : null
        const records = await transaction.property.findMany({
          where: orderedIds ? { ...where, id: { in: orderedIds } } : where,
          include: propertyInclude,
          ...(orderedIds
            ? {}
            : {
                orderBy: [orderBy, { id: 'asc' as const }],
                skip: (page - 1) * pageSize,
                take: pageSize,
              }),
        })
        if (orderedIds) {
          const position = new Map(orderedIds.map((id, index) => [id, index]))
          records.sort(
            (left, right) => (position.get(left.id) ?? 0) - (position.get(right.id) ?? 0),
          )
        }
        const total = await transaction.property.count({ where })
        const grouped = await transaction.property.groupBy({
          by: ['status'],
          where: scope,
          _count: { _all: true },
        })
        const counts: PropertyPage['counts'] = {
          DRAFT: 0,
          PUBLISHED: 0,
          RENTED: 0,
          SOLD: 0,
          INACTIVE: 0,
        }
        for (const group of grouped) counts[group.status] = group._count._all
        return {
          properties: records.map(mapProperty),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
          counts,
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }

  findByTenantAndId(
    tenantId: string,
    id: string,
    renterId?: string,
    ownerId?: string,
  ): Promise<Property | null> {
    return prisma.property
      .findFirst({
        where: { tenantId, id, ownerId, ...renterPropertyScope(tenantId, renterId) },
        include: propertyInclude,
      })
      .then((property) => (property ? mapProperty(property) : null))
  }

  update(
    tenantId: string,
    id: string,
    changes: PropertyChanges,
    actorId?: string,
  ): Promise<Property | null> {
    return prisma.$transaction(async (transaction) => {
      const existingProperty = await transaction.property.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existingProperty) {
        return null
      }

      const authorId = await resolveMutationAuthor(transaction, tenantId, actorId)
      await transaction.property.update({
        where: { id, tenantId },
        data: {
          ...toPropertyUpdateData(changes),
          updatedById: authorId,
        },
      })

      if (changes.address !== undefined) {
        await upsertAddress(transaction, tenantId, id, changes.address)
      }

      if (changes.media !== undefined) {
        await replaceMedia(transaction, tenantId, id, changes.media)
      }

      const updatedProperty = await transaction.property.findFirst({
        where: { tenantId, id },
        include: propertyInclude,
      })

      return updatedProperty ? mapProperty(updatedProperty) : null
    })
  }

  setStatus(
    tenantId: string,
    id: string,
    status: PropertyStatus,
    publishedAt: Date | null,
    actorId?: string,
  ): Promise<Property | null> {
    return prisma.$transaction(async (transaction) => {
      const existingProperty = await transaction.property.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existingProperty) {
        return null
      }

      const property = await transaction.property.update({
        where: { id, tenantId },
        data: {
          status,
          publishedAt: publishedAt,
          updatedById: await resolveMutationAuthor(transaction, tenantId, actorId),
        },
        include: propertyInclude,
      })

      return mapProperty(property)
    })
  }

  async findRenterContractProperty(
    renterId: string,
    propertyId: string,
  ): Promise<RentedProperty | null> {
    const contract = await prisma.contract.findFirst({
      where: {
        propertyId: propertyId,
        status: 'ACTIVE',
        parties: {
          some: {
            role: 'RENTER',
            userId: renterId,
            user: { active: true, role: 'RENTER' },
          },
        },
      },
      select: { tenantId: true, propertyId: true },
    })

    return contract ? { propertyId: contract.propertyId, tenantId: contract.tenantId } : null
  }

  async findContractProperty(
    tenantId: string,
    contractId: string,
  ): Promise<ActiveContractProperty | null> {
    const contract = await prisma.contract.findFirst({
      where: { tenantId, id: contractId },
      select: {
        id: true,
        status: true,
        property: {
          select: {
            id: true,
            purpose: true,
          },
        },
      },
    })

    if (!contract) {
      return null
    }

    return {
      contractId: contract.id,
      propertyId: contract.property.id,
      contractStatus: contract.status,
      purpose: contract.property.purpose,
    }
  }
}

function toPropertyUpdateData(changes: PropertyChanges): Prisma.PropertyUncheckedUpdateInput {
  return {
    ownerId: changes.ownerId,
    ownerContactId: changes.ownerContactId,
    title: changes.title,
    description: changes.description,
    purpose: changes.purpose,
    type: changes.type,
    amenities: changes.listing?.amenities,
    negotiationTerms: changes.listing?.negotiationTerms,
    publishAfterReview: changes.listing?.publishAfterReview,
    allowWhatsappContact: changes.listing?.allowWhatsappContact,
    featured: changes.listing?.featured,
    bedrooms: changes.bedrooms,
    bathrooms: changes.bathrooms,
    parkingSpots: changes.parkingSpots,
    areaSqm: changes.areaSqm,
    price: changes.price,
    rentalPrice: changes.rentalPrice,
    condoFee: changes.condoFee,
    propertyTax: changes.propertyTax,
  }
}

function toAddressData(address: PropertyAddress): Prisma.PropertyAddressCreateWithoutPropertyInput {
  return {
    street: address.street,
    number: address.number,
    complement: address.complement ?? null,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
  }
}

function toStoredMediaType(type?: string): 'PHOTO' | 'VIDEO' | 'FLOOR_PLAN' {
  return type === 'video' ? 'VIDEO' : type === 'floorPlan' ? 'FLOOR_PLAN' : 'PHOTO'
}

function toMediaCreateInput(media: PropertyMediaInput[] | undefined) {
  if (!media || media.length === 0) {
    return undefined
  }

  return {
    createMany: {
      data: media.map((media, index) => ({
        url: media.url,
        type: toStoredMediaType(media.type),
        position: media.position ?? index,
      })),
    },
  }
}

async function upsertAddress(
  transaction: PropertyTransaction,
  tenantId: string,
  propertyId: string,
  address: PropertyAddress,
) {
  await transaction.propertyAddress.upsert({
    where: { propertyId, tenantId },
    create: { propertyId, tenantId, ...toAddressData(address) },
    update: toAddressData(address),
  })
}

async function replaceMedia(
  transaction: PropertyTransaction,
  tenantId: string,
  propertyId: string,
  media: PropertyMediaInput[],
) {
  const existing = await transaction.propertyMedia.findMany({ where: { propertyId, tenantId } })
  const retainedIds = new Set<string>()
  const additions: Prisma.PropertyMediaCreateManyInput[] = []

  for (const [index, item] of media.entries()) {
    const retained = existing.find((row) => row.url === item.url && !retainedIds.has(row.id))
    const type = toStoredMediaType(item.type)
    const position = item.position ?? index
    if (retained) {
      retainedIds.add(retained.id)
      if (retained.type !== type || retained.position !== position) {
        await transaction.propertyMedia.update({
          where: { id: retained.id, propertyId, tenantId },
          data: { type, position },
        })
      }
    } else {
      additions.push({ propertyId, tenantId, url: item.url, type, position })
    }
  }

  await transaction.propertyMedia.deleteMany({
    where: { propertyId, tenantId, id: { notIn: [...retainedIds] } },
  })
  if (additions.length > 0) await transaction.propertyMedia.createMany({ data: additions })
}

function mapProperty(property: PropertyRow): Property {
  return {
    id: property.id,
    tenantId: property.tenantId,
    responsibleId: property.responsibleId,
    responsibleName: property.responsible.name,
    activeContractId: property.contracts[0]?.id ?? null,
    ownerId: property.ownerId,
    ownerContactId: property.ownerContactId,
    ownerContact: property.ownerContact,
    title: property.title,
    description: property.description,
    purpose: mapPurpose(property.purpose),
    type: property.type,
    listing: {
      amenities: property.amenities,
      negotiationTerms: property.negotiationTerms,
      publishAfterReview: property.publishAfterReview,
      allowWhatsappContact: property.allowWhatsappContact,
      featured: property.featured,
    },
    status: mapStatus(property.status),
    publishedAt: property.publishedAt,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    address: property.address ? mapAddress(property.address) : null,
    media: property.media.map((media) => ({
      id: media.id,
      url: media.url,
      type: media.type === 'VIDEO' ? 'video' : media.type === 'FLOOR_PLAN' ? 'floorPlan' : 'photo',
      position: media.position,
      createdAt: media.createdAt,
    })),
    values: {
      price: property.price.toNumber(),
      rentalPrice: property.rentalPrice?.toNumber() ?? null,
      condoFee: property.condoFee?.toNumber() ?? null,
      propertyTax: property.propertyTax?.toNumber() ?? null,
    },
    characteristics: {
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpots: property.parkingSpots,
      areaSqm: property.areaSqm?.toNumber() ?? null,
    },
  }
}

function mapAddress(address: PrismaPropertyAddress): PropertyAddress {
  return {
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    latitude: address.latitude?.toNumber() ?? null,
    longitude: address.longitude?.toNumber() ?? null,
  }
}

function mapPurpose(purpose: PropertyPurpose) {
  return purpose
}

function mapStatus(status: PrismaPropertyStatus): PropertyStatus {
  return status
}
