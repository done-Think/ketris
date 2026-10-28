import { z } from 'zod'

// External ViaCEP names are translated at the service boundary.
export const postalCodeResponseSchema = z.union([
  z.object({ erro: z.union([z.literal(true), z.literal('true')]) }),
  z.object({
    logradouro: z.string(),
    bairro: z.string(),
    localidade: z.string().min(1),
    uf: z.string().length(2),
  }),
])
