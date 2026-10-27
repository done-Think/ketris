import '@server/openapi/zod-extend'
import { z } from 'zod'

export const DEFAULT_DIRECTORY_PAGE_SIZE = 12
export const MAX_DIRECTORY_PAGE_SIZE = 48

export const directoryQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_DIRECTORY_PAGE_SIZE)
      .default(DEFAULT_DIRECTORY_PAGE_SIZE),
  })
  .strict()
  .openapi('DirectoryQuery')

export const directoryPageFields = {
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
}
