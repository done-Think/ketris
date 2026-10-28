import { captureException } from '@sentry/nextjs'

import { PropertyMediaStorageUnavailableError } from '../domain/errors'

export function propertyMediaStorageError(cause: unknown) {
  captureException(cause)
  return new PropertyMediaStorageUnavailableError(cause)
}
