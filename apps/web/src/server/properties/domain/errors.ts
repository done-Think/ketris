import { AppError, NotFoundError } from '@server/shared/errors'

export class PropertyNotFoundError extends NotFoundError {
  constructor() {
    super('Imóvel não encontrado.')
  }
}

export class PropertyPublishValidationError extends AppError {
  constructor(missingFields: string[]) {
    super('Imóvel incompleto para publicação.', {
      status: 400,
      code: 'PROPERTY_PUBLISH_VALIDATION_ERROR',
    })
    this.missingFields = missingFields
  }

  readonly missingFields: string[]
}

export class ContractPropertyTransitionError extends AppError {
  constructor() {
    super('Contrato não está ativo para transicionar o imóvel.', {
      status: 409,
      code: 'CONTRACT_NOT_ACTIVE',
    })
  }
}

export class ContractNotFoundError extends NotFoundError {
  constructor() {
    super('Contrato não encontrado.')
  }
}

export class PropertyMediaValidationError extends AppError {
  constructor(message: string) {
    super(message, { status: 400, code: 'PROPERTY_MEDIA_VALIDATION_ERROR' })
  }
}

export class PropertyOwnerValidationError extends AppError {
  constructor() {
    super('Proprietário inválido para este tenant.', {
      status: 400,
      code: 'PROPERTY_OWNER_INVALID',
    })
  }
}
