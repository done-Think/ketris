import { z } from 'zod'

export const invitationEmailSchema = z.string().trim().min(1).max(120).email().toLowerCase()
