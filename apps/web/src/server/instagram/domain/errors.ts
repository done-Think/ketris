import { AppError } from '@server/shared/errors'

export class InstagramError extends AppError {
  constructor(
    code: string,
    message = 'Não foi possível concluir a operação no Instagram.',
    status = 400,
  ) {
    super(message, { code, status })
  }
}
