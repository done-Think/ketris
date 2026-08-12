import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { Inquiry, InquiryUpdate, NewInquiry } from '../domain/inquiry.entity'
import type {
  InquiryListFilters,
  InquiryRepository,
} from '../application/ports/inquiry-repository.port'

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
  garantiaContratual: Inquiry['garantiaContratual']
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
    imovelId: row.imovelId,
    interessadoNome: row.interessadoNome,
    interessadoEmail: row.interessadoEmail,
    interessadoTelefone: row.interessadoTelefone,
    valorProposto: row.valorProposto.toNumber(),
    prazoContratoMeses: row.prazoContratoMeses,
    inicioPretendido: row.inicioPretendido,
    garantiaContratual: row.garantiaContratual,
    condicoesEspeciais: row.condicoesEspeciais,
    observacoes: row.observacoes,
    status: row.status,
    arquivadaEm: row.arquivadaEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaInquiryRepository implements InquiryRepository {
  async create(inquiry: NewInquiry): Promise<Inquiry> {
    const oportunidade = await prisma.oportunidade.create({
      data: {
        tenantId: inquiry.tenantId,
        imovelId: inquiry.imovelId,
        interessadoNome: inquiry.interessadoNome,
        interessadoEmail: inquiry.interessadoEmail,
        interessadoTelefone: inquiry.interessadoTelefone,
        valorProposto: inquiry.valorProposto,
        observacoes: inquiry.observacoes,
        status: 'ENVIADA',
      },
    })

    return toDomainInquiry(oportunidade as unknown as OportunidadeRow)
  }

  async findManyByTenant(tenantId: string, filters?: InquiryListFilters): Promise<Inquiry[]> {
    const where: Prisma.OportunidadeWhereInput = { tenantId }

    if (filters?.status) where.status = filters.status
    if (!filters?.includeArchived) where.arquivadaEm = null

    const oportunidades = await prisma.oportunidade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return oportunidades.map((row) => toDomainInquiry(row as unknown as OportunidadeRow))
  }

  async findById(id: string): Promise<Inquiry | null> {
    const oportunidade = await prisma.oportunidade.findUnique({ where: { id } })

    return oportunidade ? toDomainInquiry(oportunidade as unknown as OportunidadeRow) : null
  }

  async update(id: string, changes: InquiryUpdate): Promise<Inquiry> {
    const oportunidade = await prisma.oportunidade.update({
      where: { id },
      data: {
        interessadoNome: changes.interessadoNome,
        interessadoEmail: changes.interessadoEmail,
        interessadoTelefone: changes.interessadoTelefone,
        valorProposto: changes.valorProposto,
        prazoContratoMeses: changes.prazoContratoMeses,
        inicioPretendido: changes.inicioPretendido,
        garantiaContratual: changes.garantiaContratual,
        condicoesEspeciais: changes.condicoesEspeciais,
        observacoes: changes.observacoes,
        status: changes.status,
      },
    })

    return toDomainInquiry(oportunidade as unknown as OportunidadeRow)
  }

  async archive(id: string): Promise<Inquiry> {
    const oportunidade = await prisma.oportunidade.update({
      where: { id },
      data: { arquivadaEm: new Date() },
    })

    return toDomainInquiry(oportunidade as unknown as OportunidadeRow)
  }

  async delete(id: string): Promise<void> {
    await prisma.oportunidade.delete({ where: { id } })
  }
}
