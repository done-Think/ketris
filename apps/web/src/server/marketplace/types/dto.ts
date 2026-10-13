import type { z } from 'zod'

import type { saveAgencyProfileRequestSchema } from '../schemas/agency-profile.schema'
import type { saveBrokerProfileRequestSchema } from '../schemas/broker-profile.schema'
import type { searchPropertiesQuerySchema } from '../schemas/search-properties.schema'
import type { submitInquiryRequestSchema } from '../schemas/submit-inquiry.schema'

export type SaveAgencyProfileRequestDTO = z.infer<typeof saveAgencyProfileRequestSchema>
export type SaveBrokerProfileRequestDTO = z.infer<typeof saveBrokerProfileRequestSchema>
export type SearchPropertiesQueryDTO = z.infer<typeof searchPropertiesQuerySchema>
export type SubmitInquiryRequestDTO = z.infer<typeof submitInquiryRequestSchema>
