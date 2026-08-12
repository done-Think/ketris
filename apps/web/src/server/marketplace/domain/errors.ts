import { AppError } from '@server/shared/errors'

export class PropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado ou não está publicado.', {
      status: 404,
      code: 'PROPERTY_NOT_FOUND',
    })
  }
}

export class InquiryNotFoundError extends AppError {
  constructor() {
    super('Proposta não encontrada.', {
      status: 404,
      code: 'INQUIRY_NOT_FOUND',
    })
  }
}
