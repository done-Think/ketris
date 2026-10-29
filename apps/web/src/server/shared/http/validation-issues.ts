import type { ZodIssue, ZodTooBigIssue, ZodTooSmallIssue } from 'zod'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { RequestValidationIssue, ValidationParameter } from '../types/request-validation'
import {
  customValidationMessageKey,
  validationMessage,
  type ServerValidationMessageKey,
} from './validation-messages'

function parameter(value: unknown): ValidationParameter | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (typeof value === 'bigint') return String(value)
  if (Array.isArray(value)) {
    const result: ValidationParameter[] = []
    for (const entry of value) {
      const parsed = parameter(entry)
      if (parsed !== undefined) result.push(parsed)
    }
    return result
  }
  if (typeof value === 'object') {
    const result: Record<string, ValidationParameter> = {}
    for (const [key, entry] of Object.entries(value)) {
      const parsed = parameter(entry)
      if (parsed !== undefined) result[key] = parsed
    }
    return result
  }
  return undefined
}

function parameters(value: Record<string, unknown>): Record<string, ValidationParameter> {
  const result: Record<string, ValidationParameter> = {}
  for (const [key, entry] of Object.entries(value)) {
    const parsed = parameter(entry)
    if (parsed !== undefined) result[key] = parsed
  }
  return result
}

function sizeKey(issue: ZodTooSmallIssue | ZodTooBigIssue): ServerValidationMessageKey {
  const small = issue.code === 'too_small'
  if (issue.type === 'date') return small ? 'dateMin' : 'dateMax'
  if (issue.type === 'string') {
    if (issue.exact) return 'stringExact'
    return small
      ? issue.inclusive
        ? 'stringMin'
        : 'stringMoreThan'
      : issue.inclusive
        ? 'stringMax'
        : 'stringLessThan'
  }
  if (issue.type === 'array' || issue.type === 'set') {
    if (issue.exact) return 'itemsExact'
    return small
      ? issue.inclusive
        ? 'itemsMin'
        : 'itemsMoreThan'
      : issue.inclusive
        ? 'itemsMax'
        : 'itemsLessThan'
  }
  if (issue.exact) return 'numberExact'
  return small
    ? issue.inclusive
      ? 'numberMin'
      : 'numberMoreThan'
    : issue.inclusive
      ? 'numberMax'
      : 'numberLessThan'
}

function standardMessage(issue: ZodIssue): {
  key: ServerValidationMessageKey
  params: Record<string, ValidationParameter>
} {
  switch (issue.code) {
    case 'invalid_type': {
      const key =
        issue.received === 'undefined'
          ? 'required'
          : issue.expected === 'integer'
            ? 'integerExpected'
            : issue.expected === 'number'
              ? 'numberExpected'
              : issue.expected === 'string'
                ? 'stringExpected'
                : issue.expected === 'boolean'
                  ? 'booleanExpected'
                  : issue.expected === 'array'
                    ? 'arrayExpected'
                    : issue.expected === 'object'
                      ? 'objectExpected'
                      : issue.expected === 'date'
                        ? 'dateInvalid'
                        : 'invalidType'
      return { key, params: { expected: issue.expected, received: issue.received } }
    }
    case 'too_small':
      return {
        key: sizeKey(issue),
        params: parameters({
          type: issue.type,
          minimum: issue.minimum,
          limit: issue.minimum,
          inclusive: issue.inclusive,
          exact: issue.exact,
        }),
      }
    case 'too_big':
      return {
        key: sizeKey(issue),
        params: parameters({
          type: issue.type,
          maximum: issue.maximum,
          limit: issue.maximum,
          inclusive: issue.inclusive,
          exact: issue.exact,
        }),
      }
    case 'invalid_string': {
      const format = issue.validation
      const key =
        format === 'email'
          ? 'emailInvalid'
          : format === 'url'
            ? 'urlInvalid'
            : format === 'uuid' || format === 'cuid' || format === 'cuid2' || format === 'ulid'
              ? 'identifierInvalid'
              : format === 'datetime' || format === 'date' || format === 'time'
                ? 'dateInvalid'
                : format === 'ip'
                  ? 'ipInvalid'
                  : 'formatInvalid'
      return { key, params: parameters({ validation: format }) }
    }
    case 'invalid_date':
      return { key: 'dateInvalid', params: {} }
    case 'invalid_enum_value':
      return { key: 'optionInvalid', params: parameters({ options: issue.options }) }
    case 'invalid_union_discriminator':
      return { key: 'optionInvalid', params: parameters({ options: issue.options }) }
    case 'invalid_literal':
      return { key: 'optionInvalid', params: parameters({ expected: issue.expected }) }
    case 'unrecognized_keys':
      return { key: 'unexpectedFields', params: { keys: issue.keys } }
    case 'not_multiple_of':
      return { key: 'multipleOf', params: parameters({ multipleOf: issue.multipleOf }) }
    case 'not_finite':
      return { key: 'finite', params: {} }
    default:
      return {
        key: 'invalidValue',
        params: issue.code === 'custom' ? parameters(issue.params ?? {}) : {},
      }
  }
}

export function localizeZodIssues(
  issues: readonly ZodIssue[],
  locale: AppLocale,
): RequestValidationIssue[] {
  return issues.map((issue) => {
    const customKey = customValidationMessageKey(
      issue.message,
      issue.code === 'custom' ? issue.params : undefined,
    )
    const { key, params } = standardMessage(issue)
    return {
      path: issue.path.join('.'),
      code: issue.code,
      message: validationMessage(locale, customKey ?? key, params),
      ...(Object.keys(params).length ? { params } : {}),
    }
  })
}

export function localizeValidationIssues(
  issues: readonly RequestValidationIssue[],
  locale: AppLocale,
): RequestValidationIssue[] {
  return issues.map((issue) => ({
    ...issue,
    message: validationMessage(
      locale,
      customValidationMessageKey(issue.message, issue.params) ?? 'invalidValue',
      issue.params,
    ),
  }))
}
