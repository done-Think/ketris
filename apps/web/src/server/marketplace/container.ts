import { ArchiveInquiryUseCase } from './application/use-cases/archive-inquiry.use-case'
import { DeleteInquiryUseCase } from './application/use-cases/delete-inquiry.use-case'
import { GetInquiryUseCase } from './application/use-cases/get-inquiry.use-case'
import { GetPropertyUseCase } from './application/use-cases/get-property.use-case'
import { ListInquiriesUseCase } from './application/use-cases/list-inquiries.use-case'
import { SearchPropertiesUseCase } from './application/use-cases/search-properties.use-case'
import { SubmitInquiryUseCase } from './application/use-cases/submit-inquiry.use-case'
import { UpdateInquiryUseCase } from './application/use-cases/update-inquiry.use-case'
import { PrismaInquiryRepository } from './infrastructure/prisma-inquiry.repository'
import { PrismaPublicPropertyRepository } from './infrastructure/prisma-public-property.repository'

const propertyRepository = new PrismaPublicPropertyRepository()
const inquiryRepository = new PrismaInquiryRepository()

export const marketplaceContainer = {
  searchPropertiesUseCase: new SearchPropertiesUseCase(propertyRepository),
  getPropertyUseCase: new GetPropertyUseCase(propertyRepository),
  submitInquiryUseCase: new SubmitInquiryUseCase(propertyRepository, inquiryRepository),
  listInquiriesUseCase: new ListInquiriesUseCase(inquiryRepository),
  getInquiryUseCase: new GetInquiryUseCase(inquiryRepository),
  updateInquiryUseCase: new UpdateInquiryUseCase(inquiryRepository),
  archiveInquiryUseCase: new ArchiveInquiryUseCase(inquiryRepository),
  deleteInquiryUseCase: new DeleteInquiryUseCase(inquiryRepository),
}
