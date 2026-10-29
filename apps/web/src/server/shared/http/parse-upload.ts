import { uploadedFileSchema } from '../schemas/uploaded-file.schema'
import { RequestValidationError } from './parse-body'

export function parseUploadedFile(form: FormData): File {
  const result = uploadedFileSchema.safeParse(form.get('file'))
  if (!result.success)
    throw new RequestValidationError(
      result.error.issues.map((issue) => ({ path: 'file', message: issue.message })),
    )
  return result.data
}
