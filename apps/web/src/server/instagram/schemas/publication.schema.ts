import { z } from 'zod'

export const instagramPublicationSchema = z
  .object({
    caption: z.string().max(2200),
    imageUrls: z.array(z.string().min(1).max(2048)).min(1).max(20),
  })
  .strict()
