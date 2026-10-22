import type { z } from 'zod'

import type {
  createContractRequestSchema,
  listContractsQuerySchema,
} from '../schemas/contract-input.schema'

export type CreateContractRequestDTO = z.infer<typeof createContractRequestSchema>
export type ListContractsQueryDTO = z.infer<typeof listContractsQuerySchema>
