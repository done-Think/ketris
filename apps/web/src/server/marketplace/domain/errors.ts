import { AppError } from '@server/shared/errors'

export class PropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado ou não está publicado.', {
      status: 404,
      code: 'PROPERTY_NOT_FOUND',
    })
  }
}

export class InquiryRejectedError extends AppError {
  constructor() {
    super('Não foi possível enviar a solicitação.', { status: 400, code: 'INQUIRY_REJECTED' })
  }
}

export class InquiryQuotaExceededError extends AppError {
  constructor(readonly retryAfter: number) {
    super('Muitas solicitações para este imóvel. Tente novamente mais tarde.', {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
    })
  }
}

export class InquiryRateLimitUnavailableError extends AppError {
  constructor() {
    super('Serviço temporariamente indisponível.', {
      status: 503,
      code: 'INQUIRY_RATE_LIMIT_UNAVAILABLE',
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

export class ProfileMediaValidationError extends AppError {
  constructor(message: string) {
    super(message, { status: 400, code: 'PROFILE_MEDIA_VALIDATION_ERROR' })
  }
}

export class ProfileMediaNotFoundError extends AppError {
  constructor() {
    super('Mídia não encontrada.', { status: 404, code: 'PROFILE_MEDIA_NOT_FOUND' })
  }
}
