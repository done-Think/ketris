import type {
  Endereco,
  FinalidadeImovel,
  Imovel,
  Midia,
  Prisma,
  StatusImovel,
} from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PropertyRepository } from '../application/ports/property-repository.port'
import type {
  ActiveContractProperty,
  NewProperty,
  Property,
  PropertyAddress,
  PropertyChanges,
  PropertyListFilters,
  PropertyMediaInput,
  PropertyStatus,
} from '../domain/property.entity'

type PropertyRow = Imovel & {
  endereco: Endereco | null
  midias: Midia[]
}

type PropertyTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

const propertyInclude = {
  endereco: true,
  midias: { orderBy: { ordem: 'asc' as const } },
}

export class PrismaPropertyRepository implements PropertyRepository {
  create(property: NewProperty): Promise<Property> {
    return prisma.imovel
      .create({
        data: {
          tenantId: property.tenantId,
          responsavelId: property.responsavelId,
          titulo: property.titulo,
          descricao: property.descricao ?? null,
          finalidade: property.finalidade,
          tipo: property.tipo,
          quartos: property.quartos ?? null,
          banheiros: property.banheiros ?? null,
          vagas: property.vagas ?? null,
          areaM2: property.areaM2 ?? null,
          valor: property.valor,
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

  list(filters: PropertyListFilters): Promise<Property[]> {
    const where: Prisma.ImovelWhereInput = {
      tenantId: filters.tenantId,
      status: filters.status,
      finalidade: filters.finalidade,
    }

    return prisma.imovel
      .findMany({
        where,
        include: propertyInclude,
        orderBy: { updatedAt: 'desc' },
      })
      .then((properties) => properties.map(mapProperty))
  }

  findByTenantAndId(tenantId: string, id: string): Promise<Property | null> {
    return prisma.imovel
      .findFirst({
        where: { tenantId, id },
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
        where: { id },
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
        where: { id },
        data: { status, publicadoEm: publishedAt },
        include: propertyInclude,
      })

      return mapProperty(property)
    })
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
    titulo: changes.titulo,
    descricao: changes.descricao,
    finalidade: changes.finalidade,
    tipo: changes.tipo,
    quartos: changes.quartos,
    banheiros: changes.banheiros,
    vagas: changes.vagas,
    areaM2: changes.areaM2,
    valor: changes.valor,
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
  await transaction.midia.deleteMany({ where: { imovelId } })

  if (midias.length === 0) {
    return
  }

  await transaction.midia.createMany({
    data: midias.map((media, index) => ({
      imovelId,
      url: media.url,
      tipo: media.tipo ?? 'foto',
      ordem: media.ordem ?? index,
    })),
  })
}

function mapProperty(property: PropertyRow): Property {
  return {
    id: property.id,
    tenantId: property.tenantId,
    responsavelId: property.responsavelId,
    titulo: property.titulo,
    descricao: property.descricao,
    finalidade: mapPurpose(property.finalidade),
    tipo: property.tipo,
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
