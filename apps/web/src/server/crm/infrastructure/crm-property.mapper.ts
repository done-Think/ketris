import type { Prisma } from '@prisma/client'
import type { CrmPropertyRow } from '../types/prisma-property'
import type { CrmPropertyDetail } from '../types/property'

export const crmPropertyInclude = {
  endereco: true,
  responsavel: { select: { nome: true, avatarUrl: true } },
  midias: { orderBy: { ordem: 'asc' } },
} as const satisfies Prisma.ImovelInclude

export function toCrmProperty(row: CrmPropertyRow): CrmPropertyDetail {
  const address = row.endereco
  return {
    id: row.id,
    title: row.titulo,
    purpose: row.finalidade,
    propertyType: row.tipo,
    price: row.valor.toNumber(),
    condoFee: row.condominio?.toNumber() ?? null,
    propertyTax: row.iptu?.toNumber() ?? null,
    bedrooms: row.quartos,
    bathrooms: row.banheiros,
    parkingSpots: row.vagas,
    area: row.areaM2?.toNumber() ?? null,
    city: address?.cidade ?? null,
    neighborhood: address?.bairro ?? null,
    latitude: address?.latitude?.toNumber() ?? null,
    longitude: address?.longitude?.toNumber() ?? null,
    brokerName: row.responsavel.nome,
    brokerAvatarUrl: row.responsavel.avatarUrl,
    coverUrl: row.midias[0]?.url ?? null,
    publishedAt: row.publicadoEm?.toISOString() ?? null,
    description: row.descricao,
    address: address
      ? {
          street: address.logradouro,
          number: address.numero,
          complement: address.complemento,
          neighborhood: address.bairro,
          city: address.cidade,
          state: address.estado,
          zipCode: address.cep,
          latitude: address.latitude?.toNumber() ?? null,
          longitude: address.longitude?.toNumber() ?? null,
        }
      : null,
    media: row.midias.map((media) => ({
      id: media.id,
      url: media.url,
      type: media.tipo,
      order: media.ordem,
    })),
  }
}
