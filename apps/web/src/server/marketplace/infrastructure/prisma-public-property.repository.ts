import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  PropertySearchFilters,
  PublicPropertyRepository,
} from '../application/ports/public-property-repository.port'
import type {
  PropertyPurpose,
  PropertyMedia,
  PublishedPropertyDetail,
  PublishedPropertySummary,
} from '../domain/property.entity'

type DecimalLike = { toNumber(): number }

function toNumber(value: DecimalLike | null): number | null {
  return value === null ? null : value.toNumber()
}

type EnderecoRow = {
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude: DecimalLike | null
  longitude: DecimalLike | null
}

type MidiaRow = { id: string; url: string; tipo: string; ordem: number }

type ImovelSummaryRow = {
  id: string
  titulo: string
  finalidade: PropertyPurpose
  tipo: string
  valor: DecimalLike
  condominio: DecimalLike | null
  iptu: DecimalLike | null
  quartos: number | null
  banheiros: number | null
  vagas: number | null
  areaM2: DecimalLike | null
  publicadoEm: Date | null
  endereco: { cidade: string; bairro: string } | null
  midias: { url: string }[]
}

type ImovelDetailRow = ImovelSummaryRow & {
  tenantId: string
  descricao: string | null
  endereco: EnderecoRow | null
  midias: MidiaRow[]
}

function toSummary(row: ImovelSummaryRow): PublishedPropertySummary {
  return {
    id: row.id,
    title: row.titulo,
    purpose: row.finalidade,
    propertyType: row.tipo,
    price: row.valor.toNumber(),
    condoFee: toNumber(row.condominio),
    propertyTax: toNumber(row.iptu),
    bedrooms: row.quartos,
    bathrooms: row.banheiros,
    parkingSpots: row.vagas,
    area: toNumber(row.areaM2),
    city: row.endereco?.cidade ?? null,
    neighborhood: row.endereco?.bairro ?? null,
    coverUrl: row.midias[0]?.url ?? null,
    publishedAt: row.publicadoEm,
  }
}

function toMedia(row: MidiaRow): PropertyMedia {
  return { id: row.id, url: row.url, type: row.tipo, order: row.ordem }
}

function toDetail(row: ImovelDetailRow): PublishedPropertyDetail {
  return {
    ...toSummary(row),
    tenantId: row.tenantId,
    description: row.descricao,
    address: row.endereco
      ? {
          street: row.endereco.logradouro,
          number: row.endereco.numero,
          complement: row.endereco.complemento,
          neighborhood: row.endereco.bairro,
          city: row.endereco.cidade,
          state: row.endereco.estado,
          zipCode: row.endereco.cep,
          latitude: toNumber(row.endereco.latitude),
          longitude: toNumber(row.endereco.longitude),
        }
      : null,
    media: row.midias.map(toMedia),
  }
}

const sortOrderBy: Record<
  NonNullable<PropertySearchFilters['sortBy']>,
  Prisma.ImovelOrderByWithRelationInput
> = {
  recent: { publicadoEm: 'desc' },
  priceAsc: { valor: 'asc' },
  priceDesc: { valor: 'desc' },
}

export class PrismaPublicPropertyRepository implements PublicPropertyRepository {
  async search(filters: PropertySearchFilters): Promise<PublishedPropertySummary[]> {
    const where: Prisma.ImovelWhereInput = { status: 'PUBLISHED' }

    if (filters.purpose) where.finalidade = filters.purpose
    if (filters.propertyType) where.tipo = { equals: filters.propertyType, mode: 'insensitive' }
    if (filters.minBedrooms !== undefined) where.quartos = { gte: filters.minBedrooms }
    if (filters.minArea !== undefined) where.areaM2 = { gte: filters.minArea }
    if (filters.hasParking) where.vagas = { gt: 0 }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.valor = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      }
    }

    if (filters.city) {
      where.endereco = { is: { cidade: { equals: filters.city, mode: 'insensitive' } } }
    }

    // `location` is a free-text match across bairro/cidade combined — distinct from `city`'s
    // exact match. Matches how the home search's location field works: a substring against
    // "Bairro, Cidade" rather than a strict city filter.
    if (filters.location) {
      where.endereco = {
        is: {
          OR: [
            { bairro: { contains: filters.location, mode: 'insensitive' } },
            { cidade: { contains: filters.location, mode: 'insensitive' } },
          ],
        },
      }
    }

    if (filters.q) {
      where.OR = [
        { titulo: { contains: filters.q, mode: 'insensitive' } },
        { descricao: { contains: filters.q, mode: 'insensitive' } },
      ]
    }

    const imoveis = await prisma.imovel.findMany({
      where,
      orderBy: sortOrderBy[filters.sortBy ?? 'recent'],
      select: {
        id: true,
        titulo: true,
        finalidade: true,
        tipo: true,
        valor: true,
        condominio: true,
        iptu: true,
        quartos: true,
        banheiros: true,
        vagas: true,
        areaM2: true,
        publicadoEm: true,
        endereco: { select: { cidade: true, bairro: true } },
        midias: { orderBy: { ordem: 'asc' }, take: 1, select: { url: true } },
      },
    })

    return imoveis.map((imovel) => toSummary(imovel as unknown as ImovelSummaryRow))
  }

  async findPublishedById(id: string): Promise<PublishedPropertyDetail | null> {
    const imovel = await prisma.imovel.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: {
        endereco: true,
        midias: { orderBy: { ordem: 'asc' } },
      },
    })

    return imovel ? toDetail(imovel as unknown as ImovelDetailRow) : null
  }
}
