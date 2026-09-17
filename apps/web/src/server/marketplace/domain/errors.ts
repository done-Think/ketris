import { AppError } from '@server/shared/errors'

export class PropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado ou não está publicado.', {
      status: 404,
      code: 'PROPERTY_NOT_FOUND',
    })
  }
}
