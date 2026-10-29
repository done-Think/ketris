import { uploadedFileSchema } from '../schemas/uploaded-file.schema'
import { RequestValidationError } from './parse-body'

export function parseUploadedFile(form: FormData): File {
  const result = uploadedFileSchema.safeParse(form.get('file'))
  if (!result.success)
    throw RequestValidationError.fromZod(
      result.error.issues.map((issue) => ({ ...issue, path: ['file'] })),
    )
  return result.data
}
