import { validationIssue, validationRefinement } from '../../http/validation-messages'
import { updateUserRequestSchema } from '@server/auth/schemas/update-user.schema'
import { registerRequestSchema } from '@server/registration/schemas/register.schema'
// @vitest-environment node
import { NextRequest, NextResponse } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { AppLocale } from '@/i18n/types/locale.types'
import { AppError } from '../../errors'
import {
  handleRouteError,
  parseJsonBody,
  parseQuery,
  parseRouteParams,
  RequestValidationError,
  withErrorHandling,
} from '../../http'
import { resolveRequestLocale } from '../../http/request-locale'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

function request(locale?: AppLocale, body: unknown = {}) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(locale ? { 'Accept-Language': locale } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('request validation localization', () => {
  it.each([
    ['pt-BR', 'Telefone inválido.', 'É necessário aceitar os termos.'],
    ['en-US', 'Invalid phone number.', 'You must accept the terms.'],
    ['es-ES', 'Número de teléfono inválido.', 'Debes aceptar los términos.'],
  ] satisfies [AppLocale, string, string][])(
    'uses typed domain keys from the actual schemas in %s',
    async (locale, phoneMessage, termsMessage) => {
      await expect(
        parseJsonBody(request(locale, { phone: '0' }), updateUserRequestSchema),
      ).rejects.toMatchObject({
        issues: [{ path: 'phone', message: phoneMessage, params: { i18nKey: 'phoneInvalid' } }],
      })
      await expect(
        parseJsonBody(
          request(locale, {
            profile: 'owner',
            fullName: 'Test User',
            email: 'test@example.test',
            phone: '11999999999',
            password: 'test-password-123',
            acceptTerms: false,
          }),
          registerRequestSchema,
        ),
      ).rejects.toMatchObject({
        issues: [
          { path: 'acceptTerms', message: termsMessage, params: { i18nKey: 'termsRequired' } },
        ],
      })
      expect(
        registerRequestSchema.safeParse({
          profile: 'owner',
          fullName: 'Test User',
          email: 'test@example.test',
          phone: '11999999999',
          password: 'test-password-123',
        }).success,
      ).toBe(false)
    },
  )
  it.each([
    ['pt-BR', 'Dados inválidos.', 'Informe um e-mail válido.', 'Use ao menos 8 caracteres.'],
    [
      'en-US',
      'Invalid request data.',
      'Enter a valid email address.',
      'Use at least 8 characters.',
    ],
    [
      'es-ES',
      'Datos de solicitud inválidos.',
      'Introduce un correo electrónico válido.',
      'Usa al menos 8 caracteres.',
    ],
  ] satisfies [AppLocale, string, string, string][])(
    'localizes nested body issues in %s while preserving paths, codes and constraints',
    async (locale, title, emailMessage, passwordMessage) => {
      const schema = z.object({
        members: z.array(
          z.object({
            email: z.string().email(),
            password: z.string().min(8),
          }),
        ),
      })
      const route = withErrorHandling(async (input: NextRequest) =>
        NextResponse.json(await parseJsonBody(input, schema)),
      )
      const response = await route(
        request(locale, { members: [{ email: 'invalid', password: 'abc' }] }),
      )
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: title,
          issues: [
            {
              path: 'members.0.email',
              code: 'invalid_string',
              message: emailMessage,
              params: { validation: 'email' },
            },
            {
              path: 'members.0.password',
              code: 'too_small',
              message: passwordMessage,
              params: { type: 'string', minimum: 8, limit: 8, inclusive: true, exact: false },
            },
          ],
        },
      })
    },
  )

  it.each([
    ['pt-BR', 'Corpo da requisição não é um JSON válido.'],
    ['en-US', 'The request body is not valid JSON.'],
    ['es-ES', 'El cuerpo de la solicitud no es un JSON válido.'],
  ] satisfies [AppLocale, string][])(
    'localizes malformed JSON in %s without changing its error code',
    async (locale, message) => {
      const input = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: '{not-json',
        headers: { 'Accept-Language': locale },
      })
      await expect(parseJsonBody(input, z.object({}))).rejects.toMatchObject({
        code: 'MALFORMED_JSON_BODY',
        status: 400,
        issues: [{ path: '', message }],
      })
    },
  )

  it.each([
    ['en-US', 'The end date must be after the start date.'],
    ['es-ES', 'La fecha de fin debe ser posterior a la fecha de inicio.'],
  ] satisfies [AppLocale, string][])(
    'localizes custom refinements in %s and preserves custom domain metadata',
    async (locale, message) => {
      const schema = z
        .object({ start: z.coerce.date(), end: z.coerce.date() })
        .refine((value) => value.end > value.start, {
          path: ['end'],
          message: 'A data de término deve ser posterior à data de início.',
          params: { code: 'DATE_ORDER', note: 'João', i18nKey: 'endAfterStart' },
        })
      await expect(
        parseJsonBody(request(locale, { start: '2026-10-27', end: '2026-10-26' }), schema),
      ).rejects.toMatchObject({
        issues: [
          {
            path: 'end',
            code: 'custom',
            message,
            params: { code: 'DATE_ORDER', note: 'João', i18nKey: 'endAfterStart' },
          },
        ],
      })
    },
  )

  it('uses the explicit custom catalog and a translated fallback for unknown refinements', async () => {
    const known = z.string().refine(() => false, validationRefinement('providerRequired'))
    await expect(parseJsonBody(request('en-US', 'value'), known)).rejects.toMatchObject({
      issues: [{ path: '', code: 'custom', message: 'Select a provider or enter their details.' }],
    })
    const unknown = z.string().refine(() => false, 'Mensagem específica em português.')
    await expect(parseJsonBody(request('es-ES', 'value'), unknown)).rejects.toMatchObject({
      issues: [{ path: '', code: 'custom', message: 'Valor inválido.' }],
    })
  })

  it('localizes coerced query errors without changing successful defaults or user content', async () => {
    const schema = z.object({ page: z.coerce.number().int().min(1).default(1) })
    expect(
      parseQuery(
        new NextRequest('http://localhost/api/test', { headers: { 'Accept-Language': 'es' } }),
        schema,
      ),
    ).toEqual({ page: 1 })
    expect(parseQuery(new NextRequest('http://localhost/api/test?page=2'), schema)).toEqual({
      page: 2,
    })
    expect(() =>
      parseQuery(
        new NextRequest('http://localhost/api/test?page=0', {
          headers: { 'Accept-Language': 'en' },
        }),
        schema,
      ),
    ).toThrowError('Invalid request data.')
    await expect(
      parseJsonBody(
        request('en-US', { name: 'Olá, João', count: '3' }),
        z.object({
          name: z.string(),
          count: z.coerce.number(),
          published: z.boolean().default(false),
        }),
      ),
    ).resolves.toEqual({ name: 'Olá, João', count: 3, published: false })
  })

  it('localizes route parameter errors at the wrapper using its request argument', async () => {
    const route = withErrorHandling(
      async (_input: NextRequest, context: { params: Promise<unknown> }) => {
        await parseRouteParams(context.params, z.object({ id: z.string().min(1) }))
        return NextResponse.json({ ok: true })
      },
    )
    const response = await route(request('en-US'), { params: Promise.resolve({}) })
    expect(await response.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        issues: [{ path: 'id', code: 'invalid_type', message: 'This field is required.' }],
      },
    })
  })

  it('handles a raw ZodError and preserves manual validation codes', async () => {
    const route = withErrorHandling(async (_input: NextRequest) => {
      z.object({ email: z.string().email() }).parse({ email: 'invalid' })
      return NextResponse.json({ ok: true })
    })
    expect(await (await route(request('es-ES'))).json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        issues: [{ path: 'email', message: 'Introduce un correo electrónico válido.' }],
      },
    })
    const manual = new RequestValidationError(
      [validationIssue('file', 'fileRequired')],
      'PROFILE_MEDIA_INVALID',
    )
    expect(await handleRouteError(manual, request('en-US')).json()).toMatchObject({
      error: {
        code: 'PROFILE_MEDIA_INVALID',
        issues: [{ path: 'file', message: 'Upload a file in the file field.' }],
      },
    })
  })

  it('does not mutate Zod global messages or translate domain AppError payloads', async () => {
    const schema = z.string().email('Mensagem própria do schema.')
    const before = schema.safeParse('invalid')
    await expect(parseJsonBody(request('en-US', 'invalid'), schema)).rejects.toBeInstanceOf(
      RequestValidationError,
    )
    const after = schema.safeParse('invalid')
    expect(after.success).toBe(false)
    if (!before.success && !after.success) expect(after.error.issues).toEqual(before.error.issues)
    const error = new AppError('Mensagem de domínio.', { status: 409, code: 'DOMAIN_CONFLICT' })
    expect(await handleRouteError(error, request('en-US')).json()).toEqual({
      error: { code: 'DOMAIN_CONFLICT', message: 'Mensagem de domínio.' },
    })
  })
})

describe('request locale negotiation', () => {
  it.each<[HeadersInit, AppLocale]>([
    [{ 'Accept-Language': 'en-GB,en;q=0.9,pt;q=0.5' }, 'en-US'],
    [{ 'Accept-Language': 'fr;q=1,es-MX;q=0.8,en;q=0.5' }, 'es-ES'],
    [{ 'Accept-Language': 'en;q=0,pt;q=0.5' }, 'pt-BR'],
    [{ 'Accept-Language': 'en', Cookie: 'session=opaque; NEXT_LOCALE=es-ES' }, 'es-ES'],
    [{ 'Accept-Language': 'en', Cookie: 'NEXT_LOCALE=%invalid' }, 'en-US'],
    [{ 'Accept-Language': 'fr,de' }, 'pt-BR'],
    [{}, 'pt-BR'],
  ])('negotiates %j as %s', (headers, locale) => {
    expect(resolveRequestLocale(new Request('http://localhost', { headers }))).toBe(locale)
  })
})
