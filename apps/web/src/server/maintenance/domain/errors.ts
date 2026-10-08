import { AppError } from '@server/shared/errors'

export class MaintenanceTicketNotFoundError extends AppError {
  constructor() {
    super('Chamado de manutenção não encontrado.', {
      status: 404,
      code: 'MAINTENANCE_TICKET_NOT_FOUND',
    })
  }
}

export class MaintenancePropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado neste tenant.', {
      status: 404,
      code: 'MAINTENANCE_PROPERTY_NOT_FOUND',
    })
  }
}

export class MaintenanceTicketAlreadyResolvedError extends AppError {
  constructor() {
    super('Este chamado já foi resolvido ou fechado.', {
      status: 409,
      code: 'MAINTENANCE_TICKET_ALREADY_RESOLVED',
    })
  }
}
