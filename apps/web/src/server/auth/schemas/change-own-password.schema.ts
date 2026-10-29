import '@server/openapi/zod-extend'
import { z } from 'zod'

import { resetPasswordRequestSchema } from './reset-password.schema'

export const changeOwnPasswordRequestSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1)
      .openapi({ description: 'Senha atual do usuário.', example: 'senha-atual-123' }),
    password: resetPasswordRequestSchema.shape.password,
  })
  .strict()
  .openapi('ChangeOwnPasswordRequest')
