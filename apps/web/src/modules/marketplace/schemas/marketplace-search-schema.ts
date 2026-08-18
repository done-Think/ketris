import { z } from 'zod'

export const searchDraftSchema = z.object({
  location: z.string(),
  propertyType: z.string(),
})

export type SearchDraftFormValues = z.infer<typeof searchDraftSchema>
