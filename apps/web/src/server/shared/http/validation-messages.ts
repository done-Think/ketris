import pt from '@/i18n/messages/pt-BR/validation.json'
import en from '@/i18n/messages/en-US/validation.json'
import es from '@/i18n/messages/es-ES/validation.json'
import type { AppLocale } from '@/i18n/types/locale.types'
import { defaultLocale } from '@/i18n/routing'
import type { RequestValidationIssue, ValidationParameter } from '../types/request-validation'

export type ServerValidationMessageKey = keyof typeof pt.server

const catalogs = { 'pt-BR': pt.server, 'en-US': en.server, 'es-ES': es.server }

export function isServerValidationMessageKey(value: unknown): value is ServerValidationMessageKey {
  return typeof value === 'string' && Object.hasOwn(pt.server, value)
}

export function validationMessage(
  locale: AppLocale,
  key: ServerValidationMessageKey,
  params: Record<string, ValidationParameter> = {},
): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (_placeholder, name: string) =>
    String(params[name] ?? ''),
  )
}

export function validationMessageKey(
  params?: Record<string, unknown>,
): ServerValidationMessageKey | undefined {
  return isServerValidationMessageKey(params?.i18nKey) ? params.i18nKey : undefined
}

export function validationRefinement(
  key: ServerValidationMessageKey,
  params: Record<string, ValidationParameter> = {},
) {
  return { params: { ...params, i18nKey: key } }
}

export function validationIssue(
  path: string,
  key: ServerValidationMessageKey,
  params: Record<string, ValidationParameter> = {},
): RequestValidationIssue {
  return {
    path,
    message: validationMessage(defaultLocale, key, params),
    ...validationRefinement(key, params),
  }
}
