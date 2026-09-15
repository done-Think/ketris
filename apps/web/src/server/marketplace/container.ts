import { GetPropertyUseCase } from './application/use-cases/get-property.use-case'
import { SearchPropertiesUseCase } from './application/use-cases/search-properties.use-case'
import { SubmitInquiryUseCase } from './application/use-cases/submit-inquiry.use-case'
import { PrismaInquiryRepository } from './infrastructure/prisma-inquiry.repository'
import { PrismaPublicPropertyRepository } from './infrastructure/prisma-public-property.repository'

const propertyRepository = new PrismaPublicPropertyRepository()
const inquiryRepository = new PrismaInquiryRepository()

export const marketplaceContainer = {
  searchPropertiesUseCase: new SearchPropertiesUseCase(propertyRepository),
  getPropertyUseCase: new GetPropertyUseCase(propertyRepository),
  submitInquiryUseCase: new SubmitInquiryUseCase(propertyRepository, inquiryRepository),
}
