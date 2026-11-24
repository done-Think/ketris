import { z } from 'zod'

export function createContactLinkSchema(required: string) {
  return z.object({
    contact: z.object(
      { id: z.string().min(1), name: z.string() },
      { required_error: required, invalid_type_error: required },
    ),
  })
}
