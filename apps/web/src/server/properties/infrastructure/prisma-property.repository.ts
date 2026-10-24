import { matchingPropertyTypes } from '../domain/property-search'
import { findPropertyIdsInDisplayOrder } from './property-display-order'
import type { Endereco, FinalidadeImovel, Prisma, StatusImovel } from '@prisma/client'

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
  responsavel: { select: { nome: true } },
  contratos: {
    where: { status: 'ATIVO' as const },
    select: { id: true },
    take: 1,
    orderBy: { updatedAt: 'desc' as const },
  },
  endereco: true,
  midias: { orderBy: { ordem: 'asc' as const } },
}

function renterPropertyScope(tenantId: string, renterId?: string): Prisma.ImovelWhereInput {
  return renterId === undefined
    ? {}
    : {
        contratos: {
          some: {
            tenantId,
            status: 'ATIVO',
            partes: { some: { papel: 'LOCATARIO', usuarioId: renterId } },
          },
        },
      }
}

function propertySearchWhere(search?: string): Prisma.ImovelWhereInput {
  if (!search) return {}
  const matchingTypes = matchingPropertyTypes(search)
  const parts = search.split(',').map((part) => part.trim())
  return {
    OR: [
      { titulo: { contains: search, mode: 'insensitive' } },
      { tipo: { in: matchingTypes } },
      {
        endereco: {
          is: {
            OR: [
              { logradouro: { contains: search, mode: 'insensitive' } },
              { numero: { contains: search } },
              { bairro: { contains: search, mode: 'insensitive' } },
              { cidade: { contains: search, mode: 'insensitive' } },
              ...(parts.length === 2
                ? [
                    {
                      AND: [
                        { logradouro: { contains: parts[0], mode: 'insensitive' as const } },
                        { numero: { contains: parts[1] } },
                      ],
                    },
                    {
                      AND: [
                        { bairro: { contains: parts[0], mode: 'insensitive' as const } },
                        { cidade: { contains: parts[1], mode: 'insensitive' as const } },
                      ],
                    },
                  ]
                : []),
            ],
          },
        },
      },
      { responsavel: { nome: { contains: search, mode: 'insensitive' } } },
    ],
  }
}

export class PrismaPropertyRepository implements PropertyRepository {
  create(property: NewProperty): Promise<Property> {
    return prisma.imovel
      .create({
        data: {
          tenantId: property.tenantId,
          responsavelId: property.responsavelId,
          proprietarioId: property.proprietarioId ?? null,
          titulo: property.titulo,
          descricao: property.descricao ?? null,
          finalidade: property.finalidade,
          tipo: property.tipo,
          comodidades: property.anuncio?.comodidades ?? [],
          condicoesNegociacao: property.anuncio?.condicoesNegociacao ?? null,
          publicarAposRevisao: property.anuncio?.publicarAposRevisao ?? false,
          permiteContatoWhatsapp: property.anuncio?.permiteContatoWhatsapp ?? false,
          destaque: property.anuncio?.destaque ?? false,
          quartos: property.quartos ?? null,
          banheiros: property.banheiros ?? null,
          vagas: property.vagas ?? null,
          areaM2: property.areaM2 ?? null,
          valor: property.valor,
          valorAluguel: property.valorAluguel ?? null,
          condominio: property.condominio ?? null,
          iptu: property.iptu ?? null,
          status: 'DRAFT',
          endereco: property.endereco ? { create: toAddressData(property.endereco) } : undefined,
          midias: toMediaCreateInput(property.midias),
        },
        include: propertyInclude,
      })
      .then(mapProperty)
  }

  listPage(filters: PropertyListFilters): Promise<PropertyPage> {
    const scope: Prisma.ImovelWhereInput = {
      tenantId: filters.tenantId,
      finalidade: filters.finalidade,
      responsavelId: filters.responsavelId,
      proprietarioId: filters.proprietarioId,
      ...renterPropertyScope(filters.tenantId, filters.renterId),
    }
    const where: Prisma.ImovelWhereInput = {
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
        const orderBy: Prisma.ImovelOrderByWithRelationInput =
          sortBy === 'title'
            ? { titulo: direction }
            : sortBy === 'type'
              ? { tipo: direction }
              : sortBy === 'status'
                ? { status: direction }
                : sortBy === 'broker'
                  ? { responsavel: { nome: direction } }
                  : { updatedAt: direction }
        const customSort = ['saleValue', 'rentalValue', 'type', 'status'].includes(sortBy)
        const orderedIds = customSort
          ? await findPropertyIdsInDisplayOrder(transaction, filters)
          : null
        const records = await transaction.imovel.findMany({
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
        const total = await transaction.imovel.count({ where })
        const grouped = await transaction.imovel.groupBy({
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
    proprietarioId?: string,
  ): Promise<Property | null> {
    return prisma.imovel
      .findFirst({
        where: { tenantId, id, proprietarioId, ...renterPropertyScope(tenantId, renterId) },
        include: propertyInclude,
      })
      .then((property) => (property ? mapProperty(property) : null))
  }

  update(tenantId: string, id: string, changes: PropertyChanges): Promise<Property | null> {
    return prisma.$transaction(async (transaction) => {
      const existingProperty = await transaction.imovel.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existingProperty) {
        return null
      }

      await transaction.imovel.update({
        where: { id, tenantId },
        data: toPropertyUpdateData(changes),
      })

      if (changes.endereco !== undefined) {
        await upsertAddress(transaction, id, changes.endereco)
      }

      if (changes.midias !== undefined) {
        await replaceMedia(transaction, id, changes.midias)
      }

      const updatedProperty = await transaction.imovel.findFirst({
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
  ): Promise<Property | null> {
    return prisma.$transaction(async (transaction) => {
      const existingProperty = await transaction.imovel.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existingProperty) {
        return null
      }

      const property = await transaction.imovel.update({
        where: { id, tenantId },
        data: { status, publicadoEm: publishedAt },
        include: propertyInclude,
      })

      return mapProperty(property)
    })
  }

  async findRenterContractProperty(
    renterId: string,
    propertyId: string,
  ): Promise<RentedProperty | null> {
    const contract = await prisma.contrato.findFirst({
      where: {
        imovelId: propertyId,
        status: 'ATIVO',
        partes: {
          some: {
            papel: 'LOCATARIO',
            usuarioId: renterId,
            usuario: { ativo: true, papel: 'RENTER' },
          },
        },
      },
      select: { tenantId: true, imovelId: true },
    })

    return contract ? { propertyId: contract.imovelId, tenantId: contract.tenantId } : null
  }

  async findContractProperty(
    tenantId: string,
    contractId: string,
  ): Promise<ActiveContractProperty | null> {
    const contract = await prisma.contrato.findFirst({
      where: { tenantId, id: contractId },
      select: {
        id: true,
        status: true,
        imovel: {
          select: {
            id: true,
            finalidade: true,
          },
        },
      },
    })

    if (!contract) {
      return null
    }

    return {
      contractId: contract.id,
      propertyId: contract.imovel.id,
      contractStatus: contract.status,
      finalidade: contract.imovel.finalidade,
    }
  }
}

function toPropertyUpdateData(changes: PropertyChanges): Prisma.ImovelUpdateInput {
  return {
    proprietario:
      changes.proprietarioId === undefined
        ? undefined
        : changes.proprietarioId === null
          ? { disconnect: true }
          : { connect: { id: changes.proprietarioId } },
    titulo: changes.titulo,
    descricao: changes.descricao,
    finalidade: changes.finalidade,
    tipo: changes.tipo,
    comodidades: changes.anuncio?.comodidades,
    condicoesNegociacao: changes.anuncio?.condicoesNegociacao,
    publicarAposRevisao: changes.anuncio?.publicarAposRevisao,
    permiteContatoWhatsapp: changes.anuncio?.permiteContatoWhatsapp,
    destaque: changes.anuncio?.destaque,
    quartos: changes.quartos,
    banheiros: changes.banheiros,
    vagas: changes.vagas,
    areaM2: changes.areaM2,
    valor: changes.valor,
    valorAluguel: changes.valorAluguel,
    condominio: changes.condominio,
    iptu: changes.iptu,
  }
}

function toAddressData(address: PropertyAddress): Prisma.EnderecoCreateWithoutImovelInput {
  return {
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento ?? null,
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
    cep: address.cep,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
  }
}

function toMediaCreateInput(midias: PropertyMediaInput[] | undefined) {
  if (!midias || midias.length === 0) {
    return undefined
  }

  return {
    createMany: {
      data: midias.map((media, index) => ({
        url: media.url,
        tipo: media.tipo ?? 'foto',
        ordem: media.ordem ?? index,
      })),
    },
  }
}

async function upsertAddress(
  transaction: PropertyTransaction,
  imovelId: string,
  address: PropertyAddress,
) {
  await transaction.endereco.upsert({
    where: { imovelId },
    create: { imovelId, ...toAddressData(address) },
    update: toAddressData(address),
  })
}

async function replaceMedia(
  transaction: PropertyTransaction,
  imovelId: string,
  midias: PropertyMediaInput[],
) {
  const existing = await transaction.midia.findMany({ where: { imovelId } })
  const retainedIds = new Set<string>()
  const additions: Prisma.MidiaCreateManyInput[] = []

  for (const [index, media] of midias.entries()) {
    const retained = existing.find((item) => item.url === media.url && !retainedIds.has(item.id))
    const tipo = media.tipo ?? 'foto'
    const ordem = media.ordem ?? index
    if (retained) {
      retainedIds.add(retained.id)
      if (retained.tipo !== tipo || retained.ordem !== ordem) {
        await transaction.midia.update({
          where: { id: retained.id, imovelId },
          data: { tipo, ordem },
        })
      }
    } else {
      additions.push({ imovelId, url: media.url, tipo, ordem })
    }
  }

  await transaction.midia.deleteMany({ where: { imovelId, id: { notIn: [...retainedIds] } } })
  if (additions.length > 0) await transaction.midia.createMany({ data: additions })
}

function mapProperty(property: PropertyRow): Property {
  return {
    id: property.id,
    tenantId: property.tenantId,
    responsavelId: property.responsavelId,
    responsavelNome: property.responsavel.nome,
    activeContractId: property.contratos[0]?.id ?? null,
    proprietarioId: property.proprietarioId,
    titulo: property.titulo,
    descricao: property.descricao,
    finalidade: mapPurpose(property.finalidade),
    tipo: property.tipo,
    anuncio: {
      comodidades: property.comodidades,
      condicoesNegociacao: property.condicoesNegociacao,
      publicarAposRevisao: property.publicarAposRevisao,
      permiteContatoWhatsapp: property.permiteContatoWhatsapp,
      destaque: property.destaque,
    },
    status: mapStatus(property.status),
    publicadoEm: property.publicadoEm,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    endereco: property.endereco ? mapAddress(property.endereco) : null,
    midias: property.midias.map((media) => ({
      id: media.id,
      url: media.url,
      tipo: media.tipo,
      ordem: media.ordem,
      createdAt: media.createdAt,
    })),
    valores: {
      valor: property.valor.toNumber(),
      valorAluguel: property.valorAluguel?.toNumber() ?? null,
      condominio: property.condominio?.toNumber() ?? null,
      iptu: property.iptu?.toNumber() ?? null,
    },
    caracteristicas: {
      quartos: property.quartos,
      banheiros: property.banheiros,
      vagas: property.vagas,
      areaM2: property.areaM2?.toNumber() ?? null,
    },
  }
}

function mapAddress(address: Endereco): PropertyAddress {
  return {
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento,
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
    cep: address.cep,
    latitude: address.latitude?.toNumber() ?? null,
    longitude: address.longitude?.toNumber() ?? null,
  }
}

function mapPurpose(purpose: FinalidadeImovel) {
  return purpose
}

function mapStatus(status: StatusImovel): PropertyStatus {
  return status
}
