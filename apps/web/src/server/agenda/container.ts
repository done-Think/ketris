import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaPropertyRepository } from '@server/properties/infrastructure/prisma-property.repository'

import { CancelAgendaEventUseCase } from './application/use-cases/cancel-agenda-event.use-case'
import { CreateAgendaEventUseCase } from './application/use-cases/create-agenda-event.use-case'
import { GetAgendaEventUseCase } from './application/use-cases/get-agenda-event.use-case'
import { ListAgendaEventsUseCase } from './application/use-cases/list-agenda-events.use-case'
import { RescheduleAgendaEventUseCase } from './application/use-cases/reschedule-agenda-event.use-case'
import { UpdateAgendaEventUseCase } from './application/use-cases/update-agenda-event.use-case'
import { PrismaAgendaEventRepository } from './infrastructure/prisma-agenda-event.repository'

const agendaEventRepository = new PrismaAgendaEventRepository()
const userRepository = new PrismaUserRepository()
const propertyRepository = new PrismaPropertyRepository()

export const agendaContainer = {
  createAgendaEventUseCase: new CreateAgendaEventUseCase(
    agendaEventRepository,
    userRepository,
    propertyRepository,
  ),
  listAgendaEventsUseCase: new ListAgendaEventsUseCase(agendaEventRepository),
  getAgendaEventUseCase: new GetAgendaEventUseCase(agendaEventRepository),
  updateAgendaEventUseCase: new UpdateAgendaEventUseCase(agendaEventRepository, propertyRepository),
  rescheduleAgendaEventUseCase: new RescheduleAgendaEventUseCase(agendaEventRepository),
  cancelAgendaEventUseCase: new CancelAgendaEventUseCase(agendaEventRepository),
}
