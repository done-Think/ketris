import type { Oportunidade } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { Inquiry, NewInquiry } from '../types/inquiry'
import type { InquiryRepository } from '../application/ports/inquiry-repository.port'

function toDomainInquiry(row: Oportunidade): Inquiry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.imovelId,
    leadName: row.interessadoNome,
    leadEmail: row.interessadoEmail,
    leadPhone: row.interessadoTelefone,
    proposedValue: row.valorProposto.toNumber(),
    contractTermMonths: row.prazoContratoMeses,
    desiredStartDate: row.inicioPretendido,
    guaranteeType: row.garantiaContratual,
    specialConditions: row.condicoesEspeciais,
    notes: row.observacoes,
    status: row.status,
    archivedAt: row.arquivadaEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaInquiryRepository implements InquiryRepository {
  async create(inquiry: NewInquiry): Promise<Inquiry> {
    const imovel = await prisma.imovel.findFirstOrThrow({
      where: { id: inquiry.propertyId, tenantId: inquiry.tenantId },
      select: { responsavelId: true },
    })
    const oportunidade = await prisma.oportunidade.create({
      data: {
        tenantId: inquiry.tenantId,
        imovelId: inquiry.propertyId,
        responsavelId: imovel.responsavelId,
        interessadoNome: inquiry.leadName,
        interessadoEmail: inquiry.leadEmail,
        interessadoTelefone: inquiry.leadPhone,
        valorProposto: inquiry.proposedValue,
        observacoes: inquiry.notes,
        status: 'ENVIADA',
      },
    })

    return toDomainInquiry(oportunidade)
  }
}
