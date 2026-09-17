import { prisma } from '@server/db/prisma'

import type { Inquiry, NewInquiry } from '../domain/inquiry.entity'
import type { InquiryRepository } from '../application/ports/inquiry-repository.port'

type DecimalLike = { toNumber(): number }

type OportunidadeRow = {
  id: string
  tenantId: string
  imovelId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: DecimalLike
  prazoContratoMeses: number | null
  inicioPretendido: Date | null
  garantiaContratual: Inquiry['guaranteeType']
  condicoesEspeciais: string[]
  observacoes: string | null
  status: Inquiry['status']
  arquivadaEm: Date | null
  createdAt: Date
  updatedAt: Date
}

function toDomainInquiry(row: OportunidadeRow): Inquiry {
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
    const oportunidade = await prisma.oportunidade.create({
      data: {
        tenantId: inquiry.tenantId,
        imovelId: inquiry.propertyId,
        interessadoNome: inquiry.leadName,
        interessadoEmail: inquiry.leadEmail,
        interessadoTelefone: inquiry.leadPhone,
        valorProposto: inquiry.proposedValue,
        observacoes: inquiry.notes,
        status: 'ENVIADA',
      },
    })

    return toDomainInquiry(oportunidade as unknown as OportunidadeRow)
  }
}
