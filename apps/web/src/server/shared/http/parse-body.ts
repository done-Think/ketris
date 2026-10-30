import type { NextRequest } from 'next/server'
import type { z, ZodTypeAny } from 'zod'
import type { ZodIssue } from 'zod'
import { defaultLocale } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/types/locale.types'

import { AppError } from '@server/shared/errors'
import type { RequestValidationIssue } from '../types/request-validation'
import { resolveRequestLocale } from './request-locale'
import { localizeValidationIssues, localizeZodIssues } from './validation-issues'
import { validationIssue, validationMessage } from './validation-messages'

export class RequestValidationError extends AppError {
  readonly issues: RequestValidationIssue[]
  readonly locale: AppLocale
  private readonly originalIssues: readonly RequestValidationIssue[]
  private readonly zodIssues?: readonly ZodIssue[]

  constructor(
    issues: RequestValidationIssue[],
    code = 'VALIDATION_ERROR',
    locale: AppLocale = defaultLocale,
    zodIssues?: readonly ZodIssue[],
  ) {
    super(validationMessage(locale, 'invalidRequest'), { status: 400, code })
    this.locale = locale
    this.originalIssues = issues
    this.zodIssues = zodIssues
    this.issues = this.localizedIssues(locale)
  }

  static fromZod(issues: readonly ZodIssue[], locale: AppLocale = defaultLocale) {
    return new RequestValidationError([], 'VALIDATION_ERROR', locale, issues)
  }

  localizedIssues(locale: AppLocale): RequestValidationIssue[] {
    return this.zodIssues
      ? localizeZodIssues(this.zodIssues, locale)
      : localizeValidationIssues(this.originalIssues, locale)
  }
}

export async function parseJsonBody<T extends ZodTypeAny>(
  request: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  const locale = resolveRequestLocale(request)
  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    throw new RequestValidationError(
      [validationIssue('', 'invalidJson')],
      'MALFORMED_JSON_BODY',
      locale,
    )
  }

  const result = schema.safeParse(raw)

  if (!result.success) {
    throw RequestValidationError.fromZod(result.error.issues, locale)
  }

  return result.data
}
