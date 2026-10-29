import { z } from 'zod'

export const uploadedFileSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  { message: 'Envie um arquivo em "file".' },
)
