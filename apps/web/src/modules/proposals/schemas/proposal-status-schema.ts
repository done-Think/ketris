import { z } from 'zod'

export const proposalStatusSchema = z.object({
  status: z.enum(['underReview', 'counteroffer', 'approved']),
})
