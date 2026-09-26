import { GetAgencyProfileUseCase } from './application/use-cases/get-agency-profile.use-case'
import { GetBrokerProfileUseCase } from './application/use-cases/get-broker-profile.use-case'
import { GetOwnAgencyProfileUseCase } from './application/use-cases/get-own-agency-profile.use-case'
import { GetOwnBrokerProfileUseCase } from './application/use-cases/get-own-broker-profile.use-case'
import { GetPropertyUseCase } from './application/use-cases/get-property.use-case'
import { ListAgencyProfilesUseCase } from './application/use-cases/list-agency-profiles.use-case'
import { ListBrokerProfilesUseCase } from './application/use-cases/list-broker-profiles.use-case'
import { SearchPropertiesUseCase } from './application/use-cases/search-properties.use-case'
import { PublishAgencyProfileUseCase } from './application/use-cases/publish-agency-profile.use-case'
import { PublishBrokerProfileUseCase } from './application/use-cases/publish-broker-profile.use-case'
import { SaveAgencyProfileUseCase } from './application/use-cases/save-agency-profile.use-case'
import { SaveBrokerProfileUseCase } from './application/use-cases/save-broker-profile.use-case'
import { SubmitInquiryUseCase } from './application/use-cases/submit-inquiry.use-case'
import { UnpublishAgencyProfileUseCase } from './application/use-cases/unpublish-agency-profile.use-case'
import { UnpublishBrokerProfileUseCase } from './application/use-cases/unpublish-broker-profile.use-case'
import { UploadProfileMediaUseCase } from './application/use-cases/upload-profile-media.use-case'
import { PrismaAgencyProfileRepository } from './infrastructure/prisma-agency-profile.repository'
import { PrismaBrokerProfileRepository } from './infrastructure/prisma-broker-profile.repository'
import { PrismaInquiryRepository } from './infrastructure/prisma-inquiry.repository'
import { PrismaPublicPropertyRepository } from './infrastructure/prisma-public-property.repository'
import { S3ProfileMediaStorage } from './infrastructure/s3-profile-media-storage'

const propertyRepository = new PrismaPublicPropertyRepository()
const inquiryRepository = new PrismaInquiryRepository()
const brokerProfileRepository = new PrismaBrokerProfileRepository()
const agencyProfileRepository = new PrismaAgencyProfileRepository()
const profileMediaStorage = new S3ProfileMediaStorage()

export const marketplaceContainer = {
  searchPropertiesUseCase: new SearchPropertiesUseCase(propertyRepository),
  getPropertyUseCase: new GetPropertyUseCase(propertyRepository),
  submitInquiryUseCase: new SubmitInquiryUseCase(propertyRepository, inquiryRepository),

  getBrokerProfileUseCase: new GetBrokerProfileUseCase(brokerProfileRepository),
  listBrokerProfilesUseCase: new ListBrokerProfilesUseCase(brokerProfileRepository),
  getOwnBrokerProfileUseCase: new GetOwnBrokerProfileUseCase(brokerProfileRepository),
  saveBrokerProfileUseCase: new SaveBrokerProfileUseCase(brokerProfileRepository),
  publishBrokerProfileUseCase: new PublishBrokerProfileUseCase(brokerProfileRepository),
  unpublishBrokerProfileUseCase: new UnpublishBrokerProfileUseCase(brokerProfileRepository),

  getAgencyProfileUseCase: new GetAgencyProfileUseCase(agencyProfileRepository),
  listAgencyProfilesUseCase: new ListAgencyProfilesUseCase(agencyProfileRepository),
  getOwnAgencyProfileUseCase: new GetOwnAgencyProfileUseCase(agencyProfileRepository),
  saveAgencyProfileUseCase: new SaveAgencyProfileUseCase(agencyProfileRepository),
  publishAgencyProfileUseCase: new PublishAgencyProfileUseCase(agencyProfileRepository),
  unpublishAgencyProfileUseCase: new UnpublishAgencyProfileUseCase(agencyProfileRepository),

  uploadProfileMediaUseCase: new UploadProfileMediaUseCase(profileMediaStorage),
}
