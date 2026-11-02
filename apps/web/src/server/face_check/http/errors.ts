import { AppError } from '@server/shared/errors'

export class FaceCheckError extends AppError {
  constructor(
    code: string,
    status = 400,
    readonly reason: string | null = null,
  ) {
    super(code, { status, code })
  }
}
