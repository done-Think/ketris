import type { z } from 'zod'
import type { CrmScope } from './prisma'
import type { CrmInteraction } from './interaction'
import type { completeInteractionSchema } from '../schemas/interaction.schema'

export type CompleteInteractionInput = CrmScope &
  z.infer<typeof completeInteractionSchema> & { interactionId: string; actorId: string }
export type CompleteInteractionOutput = CrmInteraction
