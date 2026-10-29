import type { CreatedInquiry, Inquiry } from '../types/inquiry'

export function toCreatedInquiry(inquiry: Inquiry): CreatedInquiry {
  return {
    id: inquiry.id,
    propertyId: inquiry.propertyId,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
  }
}
