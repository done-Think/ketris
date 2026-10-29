import { PrismaAgendaPropertyCatalog } from './infrastructure/prisma-agenda-property-catalog'
import { ListAgendaPropertiesUseCase } from './application/use-cases/list-agenda-properties.use-case'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaAgendaPropertyLookup } from './infrastructure/prisma-agenda-property-lookup'

import { CancelAgendaEventUseCase } from './application/use-cases/cancel-agenda-event.use-case'
import { CreateAgendaEventUseCase } from './application/use-cases/create-agenda-event.use-case'
import { GetAgendaEventUseCase } from './application/use-cases/get-agenda-event.use-case'
import { ListAgendaEventsUseCase } from './application/use-cases/list-agenda-events.use-case'
import { RescheduleAgendaEventUseCase } from './application/use-cases/reschedule-agenda-event.use-case'
import { UpdateAgendaEventUseCase } from './application/use-cases/update-agenda-event.use-case'
import { PrismaAgendaEventRepository } from './infrastructure/prisma-agenda-event.repository'

const agendaEventRepository = new PrismaAgendaEventRepository()
const userRepository = new PrismaUserRepository()
const propertyRepository = new PrismaAgendaPropertyLookup()

const propertyCatalog = new PrismaAgendaPropertyCatalog()

export const agendaContainer = {
  listAgendaPropertiesUseCase: new ListAgendaPropertiesUseCase(propertyCatalog),
  createAgendaEventUseCase: new CreateAgendaEventUseCase(
    agendaEventRepository,
    userRepository,
    propertyRepository,
    propertyCatalog,
  ),
  listAgendaEventsUseCase: new ListAgendaEventsUseCase(agendaEventRepository, propertyCatalog),
  getAgendaEventUseCase: new GetAgendaEventUseCase(agendaEventRepository, propertyCatalog),
  updateAgendaEventUseCase: new UpdateAgendaEventUseCase(
    agendaEventRepository,
    propertyRepository,
    userRepository,
    propertyCatalog,
  ),
  rescheduleAgendaEventUseCase: new RescheduleAgendaEventUseCase(
    agendaEventRepository,
    propertyCatalog,
  ),
  cancelAgendaEventUseCase: new CancelAgendaEventUseCase(agendaEventRepository, propertyCatalog),
}
