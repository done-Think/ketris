import { validationRefinement } from '@server/shared/http/validation-messages'
import { z } from 'zod'

const dateText = z
  .string()
  .trim()
  .refine((value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value)
    if (!match || !Number.isFinite(Date.parse(value))) return false
    const [, year, month, day] = match
    const calendarDate = new Date(year + '-' + month + '-' + day + 'T00:00:00.000Z')
    return (
      calendarDate.getUTCFullYear() === Number(year) &&
      calendarDate.getUTCMonth() + 1 === Number(month) &&
      calendarDate.getUTCDate() === Number(day)
    )
  }, validationRefinement('isoDateInvalid'))

export const crmDateSchema = z.union([z.date(), dateText]).pipe(z.coerce.date())
