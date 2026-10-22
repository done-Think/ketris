import { describe, expect, it } from 'vitest'

import { extractErrorMessage, getApiErrorCode } from '../../utils/error-message'

describe('extractErrorMessage', () => {
  it('uses a localized code mapping instead of the raw API message', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          error: {
            code: 'CONTACT_EMAIL_ALREADY_EXISTS',
            message: 'Já existe um contato com este e-mail.',
          },
        },
      },
    }

    expect(
      extractErrorMessage(error, 'Could not save the contact.', {
        CONTACT_EMAIL_ALREADY_EXISTS: 'A contact with this email already exists.',
      }),
    ).toBe('A contact with this email already exists.')
    expect(extractErrorMessage(error, 'No se pudo guardar el contacto.')).toBe(
      'No se pudo guardar el contacto.',
    )
  })

  it('uses the translated fallback for unknown errors', () => {
    expect(extractErrorMessage(new Error('Mensagem interna'), 'Something went wrong.')).toBe(
      'Something went wrong.',
    )
  })
})

describe('getApiErrorCode', () => {
  it('returns the API error code from an axios error', () => {
    const error = {
      isAxiosError: true,
      response: { data: { error: { code: 'INVALID_CURRENT_PASSWORD' } } },
    }

    expect(getApiErrorCode(error)).toBe('INVALID_CURRENT_PASSWORD')
  })

  it('returns undefined for non-axios errors or responses without a code', () => {
    expect(getApiErrorCode(new Error('network'))).toBeUndefined()
    expect(getApiErrorCode({ isAxiosError: true, response: { data: {} } })).toBeUndefined()
  })
})
