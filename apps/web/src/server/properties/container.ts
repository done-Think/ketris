import { PrismaPropertyBrokerDirectory } from './infrastructure/prisma-property-broker-directory'
import { ListPropertyBrokersUseCase } from './application/use-cases/list-property-brokers.use-case'
import { PrismaPropertyOwnerDirectory } from './infrastructure/prisma-property-owner-directory'
import { PrismaPropertyHistoryRepository } from './infrastructure/prisma-property-history.repository'
import { ReadPropertyHistoryUseCase } from './application/use-cases/read-property-history.use-case'
import { CrmPropertyOwnerContactDirectory } from './infrastructure/crm-property-owner-contact-directory'
import { ListPropertyOwnersUseCase } from './application/use-cases/list-property-owners.use-case'
import { CreatePropertyUseCase } from './application/use-cases/create-property.use-case'
import { DeletePropertyUseCase } from './application/use-cases/delete-property.use-case'
import { GetPropertyUseCase } from './application/use-cases/get-property.use-case'
import { ListPropertiesUseCase } from './application/use-cases/list-properties.use-case'
import { PublishPropertyUseCase } from './application/use-cases/publish-property.use-case'
import { TransitionPropertyFromActiveContractUseCase } from './application/use-cases/transition-property-from-active-contract.use-case'
import { UnpublishPropertyUseCase } from './application/use-cases/unpublish-property.use-case'
import { UpdatePropertyUseCase } from './application/use-cases/update-property.use-case'
import { UploadPropertyMediaUseCase } from './application/use-cases/upload-property-media.use-case'
import { PrismaPropertyRepository } from './infrastructure/prisma-property.repository'
import { S3PropertyMediaStorage } from './infrastructure/s3-property-media-storage'
import { LocalPropertyMediaStorage } from './infrastructure/local-property-media-storage'
import { shouldUseLocalUploadsStorage } from '@server/shared/storage/s3-client'
import { addressGeocoder } from '@server/shared/location/geocoder'

const propertyRepository = new PrismaPropertyRepository()
const propertyBrokers = new PrismaPropertyBrokerDirectory()
const propertyOwnerDirectory = new PrismaPropertyOwnerDirectory()
const propertyOwnerContacts = new CrmPropertyOwnerContactDirectory()
const propertyMediaStorage = shouldUseLocalUploadsStorage()
  ? new LocalPropertyMediaStorage()
  : new S3PropertyMediaStorage()

export const propertiesContainer = {
  listPropertyBrokersUseCase: new ListPropertyBrokersUseCase(propertyBrokers),
  readPropertyHistoryUseCase: new ReadPropertyHistoryUseCase(
    new GetPropertyUseCase(propertyRepository),
    new PrismaPropertyHistoryRepository(),
  ),
  listPropertyOwnersUseCase: new ListPropertyOwnersUseCase(propertyOwnerDirectory),
  createPropertyUseCase: new CreatePropertyUseCase(
    propertyRepository,
    propertyOwnerDirectory,
    addressGeocoder,
    propertyOwnerContacts,
    propertyBrokers,
  ),
  listPropertiesUseCase: new ListPropertiesUseCase(propertyRepository),
  getPropertyUseCase: new GetPropertyUseCase(propertyRepository),
  updatePropertyUseCase: new UpdatePropertyUseCase(
    propertyRepository,
    propertyOwnerDirectory,
    addressGeocoder,
    propertyOwnerContacts,
    propertyBrokers,
  ),
  deletePropertyUseCase: new DeletePropertyUseCase(propertyRepository),
  publishPropertyUseCase: new PublishPropertyUseCase(propertyRepository),
  unpublishPropertyUseCase: new UnpublishPropertyUseCase(propertyRepository),
  transitionPropertyFromActiveContractUseCase: new TransitionPropertyFromActiveContractUseCase(
    propertyRepository,
  ),
  uploadPropertyMediaUseCase: new UploadPropertyMediaUseCase(propertyMediaStorage),
}
