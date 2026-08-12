import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  PropertySearchFilters,
  PublicPropertyRepository,
} from '../application/ports/public-property-repository.port'
import type {
  Finalidade,
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
  finalidade: Finalidade
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
    titulo: row.titulo,
    finalidade: row.finalidade,
    tipo: row.tipo,
    valor: row.valor.toNumber(),
    condominio: toNumber(row.condominio),
    iptu: toNumber(row.iptu),
    quartos: row.quartos,
    banheiros: row.banheiros,
    vagas: row.vagas,
    areaM2: toNumber(row.areaM2),
    cidade: row.endereco?.cidade ?? null,
    bairro: row.endereco?.bairro ?? null,
    capaUrl: row.midias[0]?.url ?? null,
    publicadoEm: row.publicadoEm,
  }
}

function toMedia(row: MidiaRow): PropertyMedia {
  return { id: row.id, url: row.url, tipo: row.tipo, ordem: row.ordem }
}

function toDetail(row: ImovelDetailRow): PublishedPropertyDetail {
  return {
    ...toSummary(row),
    tenantId: row.tenantId,
    descricao: row.descricao,
    endereco: row.endereco
      ? {
          logradouro: row.endereco.logradouro,
          numero: row.endereco.numero,
          complemento: row.endereco.complemento,
          bairro: row.endereco.bairro,
          cidade: row.endereco.cidade,
          estado: row.endereco.estado,
          cep: row.endereco.cep,
          latitude: toNumber(row.endereco.latitude),
          longitude: toNumber(row.endereco.longitude),
        }
      : null,
    midias: row.midias.map(toMedia),
  }
}

export class PrismaPublicPropertyRepository implements PublicPropertyRepository {
  async search(filters: PropertySearchFilters): Promise<PublishedPropertySummary[]> {
    const where: Prisma.ImovelWhereInput = { status: 'PUBLICADO' }

    if (filters.finalidade) where.finalidade = filters.finalidade
    if (filters.tipo) where.tipo = { equals: filters.tipo, mode: 'insensitive' }
    if (filters.quartosMin !== undefined) where.quartos = { gte: filters.quartosMin }

    if (filters.precoMin !== undefined || filters.precoMax !== undefined) {
      where.valor = {
        ...(filters.precoMin !== undefined ? { gte: filters.precoMin } : {}),
        ...(filters.precoMax !== undefined ? { lte: filters.precoMax } : {}),
      }
    }

    if (filters.cidade) {
      where.endereco = { is: { cidade: { equals: filters.cidade, mode: 'insensitive' } } }
    }

    if (filters.q) {
      where.OR = [
        { titulo: { contains: filters.q, mode: 'insensitive' } },
        { descricao: { contains: filters.q, mode: 'insensitive' } },
      ]
    }

    const imoveis = await prisma.imovel.findMany({
      where,
      orderBy: { publicadoEm: 'desc' },
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
      where: { id, status: 'PUBLICADO' },
      include: {
        endereco: true,
        midias: { orderBy: { ordem: 'asc' } },
      },
    })

    return imovel ? toDetail(imovel as unknown as ImovelDetailRow) : null
  }
}
