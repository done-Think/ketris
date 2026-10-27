import type { NewInquiry, Inquiry } from '../../types/inquiry'

export interface InquiryRepository {
  create(inquiry: NewInquiry): Promise<Inquiry>
}
