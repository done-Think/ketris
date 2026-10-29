import type { NextRequest } from 'next/server'
import type { z, ZodTypeAny } from 'zod'

import { RequestValidationError } from './parse-body'
import { resolveRequestLocale } from './request-locale'
import type { AppLocale } from '@/i18n/types/locale.types'
import { defaultLocale } from '@/i18n/routing'

export function parseQuery<T extends ZodTypeAny>(request: NextRequest, schema: T): z.infer<T> {
  return parseRequestInput(
    Object.fromEntries(request.nextUrl.searchParams),
    schema,
    resolveRequestLocale(request),
  )
}

export async function parseRouteParams<T extends ZodTypeAny>(
  params: Promise<unknown>,
  schema: T,
  request?: Request,
): Promise<z.infer<T>> {
  return parseRequestInput(await params, schema, resolveRequestLocale(request))
}

function parseRequestInput<T extends ZodTypeAny>(
  input: unknown,
  schema: T,
  locale: AppLocale = defaultLocale,
): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw RequestValidationError.fromZod(result.error.issues, locale)
  }
  return result.data
}
