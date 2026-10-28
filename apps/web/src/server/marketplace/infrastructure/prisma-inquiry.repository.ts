import type { Opportunity } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { PostgresRateLimitStore } from '@server/security/postgres-rate-limit-store'
import { inquiryContactRateLimitKey, inquiryContactRateLimitPolicy } from './inquiry-rate-limit'
import {
  InquiryQuotaExceededError,
  InquiryRateLimitUnavailableError,
  PropertyNotFoundError,
} from '../domain/errors'

import type { Inquiry, NewInquiry } from '../types/inquiry'
import type { InquiryRepository } from '../application/ports/inquiry-repository.port'

function toDomainInquiry(row: Opportunity): Inquiry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.propertyId,
    leadName: row.interestedName,
    leadEmail: row.interestedEmail,
    leadPhone: row.interestedPhone,
    proposedValue: row.proposedValue.toNumber(),
    contractTermMonths: row.contractTermMonths,
    desiredStartDate: row.desiredStart,
    guaranteeType: row.contractGuarantee,
    specialConditions: row.specialConditions,
    notes: row.notes,
    status: row.status,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaInquiryRepository implements InquiryRepository {
  async create(inquiry: NewInquiry): Promise<Inquiry> {
    const key = inquiryContactRateLimitKey(inquiry.propertyId, inquiry.leadEmail)
    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findFirst({
        where: { id: inquiry.propertyId, tenantId: inquiry.tenantId, status: 'PUBLISHED' },
        select: { responsibleId: true },
      })
      if (!property) throw new PropertyNotFoundError()
      const store = new PostgresRateLimitStore(tx, false)
      const result = await store
        .consume({ key, policy: inquiryContactRateLimitPolicy() })
        .catch(() => {
          throw new InquiryRateLimitUnavailableError()
        })
      if (!result.allowed) throw new InquiryQuotaExceededError(result.retryAfter)
      const opportunity = await tx.opportunity.create({
        data: {
          tenantId: inquiry.tenantId,
          propertyId: inquiry.propertyId,
          responsibleId: property.responsibleId,
          interestedName: inquiry.leadName,
          interestedEmail: inquiry.leadEmail.trim().toLowerCase(),
          interestedPhone: inquiry.leadPhone,
          proposedValue: inquiry.proposedValue,
          notes: inquiry.notes,
          status: 'SENT',
        },
      })
      return toDomainInquiry(opportunity)
    })
  }
}
