import { INTERACTION_NOTE_LIMIT } from '@server/crm/constants/interactions'
import { z } from 'zod'

export function createInteractionResultSchema(required: string, maximum: string) {
  return z.object({
    status: z.enum(['CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED'], { required_error: required }),
    description: z.string().trim().max(INTERACTION_NOTE_LIMIT, maximum),
  })
}
