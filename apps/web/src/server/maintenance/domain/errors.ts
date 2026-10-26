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

export class MaintenanceAttachmentValidationError extends AppError {
  constructor(message: string) {
    super(message, { status: 400, code: 'MAINTENANCE_ATTACHMENT_VALIDATION_ERROR' })
  }
}

export class MaintenanceProviderNotFoundError extends AppError {
  constructor() {
    super('Prestador não encontrado.', { status: 404, code: 'MAINTENANCE_PROVIDER_NOT_FOUND' })
  }
}

export class MaintenanceProviderInactiveError extends AppError {
  constructor() {
    super('O prestador está inativo. Solicite a reativação à gestão.', {
      status: 409,
      code: 'MAINTENANCE_PROVIDER_INACTIVE',
    })
  }
}

export class MaintenanceProviderAlreadyExistsError extends AppError {
  constructor() {
    super('Já existe um prestador com esses dados nesta imobiliária.', {
      status: 409,
      code: 'MAINTENANCE_PROVIDER_ALREADY_EXISTS',
    })
  }
}
