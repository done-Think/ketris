import { AppError } from '@server/shared/errors'

export class PropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado ou não está publicado.', {
      status: 404,
      code: 'PROPERTY_NOT_FOUND',
    })
  }
}

export class BrokerProfileNotFoundError extends AppError {
  constructor() {
    super('Perfil de corretor não encontrado ou não está publicado.', {
      status: 404,
      code: 'BROKER_PROFILE_NOT_FOUND',
    })
  }
}

export class AgencyProfileNotFoundError extends AppError {
  constructor() {
    super('Perfil de imobiliária não encontrado ou não está publicado.', {
      status: 404,
      code: 'AGENCY_PROFILE_NOT_FOUND',
    })
  }
}

export class ProfilePublishValidationError extends AppError {
  constructor(missingFields: string[]) {
    super(`Preencha os campos obrigatórios antes de publicar: ${missingFields.join(', ')}.`, {
      status: 422,
      code: 'PROFILE_PUBLISH_VALIDATION',
    })
  }
}
