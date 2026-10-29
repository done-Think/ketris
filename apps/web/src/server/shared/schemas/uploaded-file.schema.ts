import { validationRefinement } from '@server/shared/http/validation-messages'
import { z } from 'zod'

export const uploadedFileSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  { ...validationRefinement('fileRequired') },
)
