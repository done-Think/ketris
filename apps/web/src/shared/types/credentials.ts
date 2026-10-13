import type { z } from 'zod'

import type { createCredentialsSchema } from '../schemas/credentials-schema'

export type CredentialsFormValues = z.infer<ReturnType<typeof createCredentialsSchema>>
