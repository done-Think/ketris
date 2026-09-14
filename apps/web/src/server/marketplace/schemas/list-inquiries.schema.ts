import '@server/openapi/zod-extend'
import { z } from 'zod'

import { inquirySchema, inquiryStatusSchema } from './inquiry.schema'

export const listInquiriesQuerySchema = z
  .object({
    status: inquiryStatusSchema.optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('ListInquiriesQuery')

export type ListInquiriesQueryDTO = z.infer<typeof listInquiriesQuerySchema>

export const listInquiriesResponseSchema = z
  .object({
    inquiries: z.array(inquirySchema),
  })
  .openapi('ListInquiriesResponse')

export const getInquiryResponseSchema = z
  .object({
    inquiry: inquirySchema,
  })
  .openapi('GetInquiryResponse')
