import '@server/openapi/zod-extend'
import { z } from 'zod'

export const deleteInquiryQuerySchema = z
  .object({
    permanent: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('DeleteInquiryQuery')

export type DeleteInquiryQueryDTO = z.infer<typeof deleteInquiryQuerySchema>
