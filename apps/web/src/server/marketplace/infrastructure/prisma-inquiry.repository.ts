import { prisma } from '@server/db/prisma'

import type { CreatedInquiry, NewInquiry } from '../domain/inquiry.entity'
import type { InquiryRepository } from '../application/ports/inquiry-repository.port'

export class PrismaInquiryRepository implements InquiryRepository {
  async create(inquiry: NewInquiry): Promise<CreatedInquiry> {
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
      select: { id: true, imovelId: true, createdAt: true },
    })

    return {
      id: oportunidade.id,
      imovelId: oportunidade.imovelId,
      status: 'ENVIADA',
      createdAt: oportunidade.createdAt,
    }
  }
}
