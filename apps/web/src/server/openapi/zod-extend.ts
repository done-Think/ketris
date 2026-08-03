import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Side-effect: adiciona o método `.openapi()` aos schemas Zod. Precisa rodar antes de qualquer
// `schemas/*.schema.ts` ser importado — por isso todo schema.ts importa este arquivo primeiro (mesmo sem
// usar o valor exportado).
extendZodWithOpenApi(z)
