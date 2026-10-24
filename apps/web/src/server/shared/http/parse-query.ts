import type { NextRequest } from 'next/server'
import type { z, ZodTypeAny } from 'zod'

import { RequestValidationError } from './parse-body'

export function parseQuery<T extends ZodTypeAny>(request: NextRequest, schema: T): z.infer<T> {
  return parseRequestInput(Object.fromEntries(request.nextUrl.searchParams), schema)
}

export async function parseRouteParams<T extends ZodTypeAny>(
  params: Promise<unknown>,
  schema: T,
): Promise<z.infer<T>> {
  return parseRequestInput(await params, schema)
}

function parseRequestInput<T extends ZodTypeAny>(input: unknown, schema: T): z.infer<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new RequestValidationError(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    )
  }
  return result.data
}
