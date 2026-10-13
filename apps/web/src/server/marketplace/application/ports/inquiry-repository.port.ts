import type { NewInquiry, Inquiry } from '../../domain/inquiry.entity'

export interface InquiryRepository {
  create(inquiry: NewInquiry): Promise<Inquiry>
}
