import { describe, expect, it } from 'vitest'
import { createUserRequestSchema } from '../../schemas/create-user.schema'
import { updateUserRequestSchema } from '../../schemas/update-user.schema'
import { refreshTokenRequestSchema } from '../../schemas/refresh-token.schema'
import { resetPasswordRequestSchema } from '../../schemas/reset-password.schema'
import { logoutRequestSchema } from '../../schemas/logout.schema'
import { changeOwnPasswordRequestSchema } from '../../schemas/change-own-password.schema'
import {
  requestPasswordResetCodeSchema,
  verifyPasswordResetCodeSchema,
} from '../../schemas/password-reset-code.schema'

const cases = [
  [
    'criação',
    createUserRequestSchema,
    { name: 'Ana', email: 'ana@example.test', password: 'senha-somente-teste', role: 'AGENT' },
  ],
  [
    'profile',
    updateUserRequestSchema,
    { name: 'Ana', phone: '(11) 99999-9999', creci: '12345-F', avatarUrl: null },
  ],
  ['refresh', refreshTokenRequestSchema, { refreshToken: 'test-only' }],
  [
    'reset',
    resetPasswordRequestSchema,
    {
      email: 'ana@example.test',
      tenantId: 't1',
      password: 'senha-somente-teste',
      resetToken: 'test-only',
    },
  ],
  ['logout', logoutRequestSchema, { refreshToken: 'test-only' }],
  [
    'senha própria',
    changeOwnPasswordRequestSchema,
    { currentPassword: 'senha-atual', password: 'senha-somente-teste' },
  ],
  [
    'solicitar recuperação',
    requestPasswordResetCodeSchema,
    { email: 'ana@example.test', locale: 'pt-BR' },
  ],
  [
    'verificar recuperação',
    verifyPasswordResetCodeSchema,
    { email: 'ana@example.test', tenantId: 't1', code: '123456' },
  ],
] as const

describe('contratos de entrada Auth', () => {
  it.each(cases)(
    '%s preserva campos legítimos e rejeita campos desconhecidos',
    (_name, schema, input) => {
      expect(schema.safeParse(input).success).toBe(true)
      const result = schema.safeParse({ ...input, unknownField: 'probe' })
      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error.issues.some((issue) => issue.code === 'unrecognized_keys')).toBe(true)
    },
  )
})
