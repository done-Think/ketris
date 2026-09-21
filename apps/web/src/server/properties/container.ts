import { CreatePropertyUseCase } from './application/use-cases/create-property.use-case'
import { DeletePropertyUseCase } from './application/use-cases/delete-property.use-case'
import { GetPropertyUseCase } from './application/use-cases/get-property.use-case'
import { ListPropertiesUseCase } from './application/use-cases/list-properties.use-case'
import { PublishPropertyUseCase } from './application/use-cases/publish-property.use-case'
import { TransitionPropertyFromActiveContractUseCase } from './application/use-cases/transition-property-from-active-contract.use-case'
import { UnpublishPropertyUseCase } from './application/use-cases/unpublish-property.use-case'
import { UpdatePropertyUseCase } from './application/use-cases/update-property.use-case'
import { PrismaPropertyRepository } from './infrastructure/prisma-property.repository'

const propertyRepository = new PrismaPropertyRepository()

export const propertiesContainer = {
  createPropertyUseCase: new CreatePropertyUseCase(propertyRepository),
  listPropertiesUseCase: new ListPropertiesUseCase(propertyRepository),
  getPropertyUseCase: new GetPropertyUseCase(propertyRepository),
  updatePropertyUseCase: new UpdatePropertyUseCase(propertyRepository),
  deletePropertyUseCase: new DeletePropertyUseCase(propertyRepository),
  publishPropertyUseCase: new PublishPropertyUseCase(propertyRepository),
  unpublishPropertyUseCase: new UnpublishPropertyUseCase(propertyRepository),
  transitionPropertyFromActiveContractUseCase: new TransitionPropertyFromActiveContractUseCase(
    propertyRepository,
  ),
}
