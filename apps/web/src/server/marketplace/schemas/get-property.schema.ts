import '@server/openapi/zod-extend'
import { z } from 'zod'

import { publicPropertyDetailSchema } from './property.schema'

export const getPropertyResponseSchema = z
  .object({
    property: publicPropertyDetailSchema,
  })
  .openapi('GetPropertyResponse')
