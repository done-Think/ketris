import { z } from 'zod'

export const chargeDateSchema = z.string().date()
