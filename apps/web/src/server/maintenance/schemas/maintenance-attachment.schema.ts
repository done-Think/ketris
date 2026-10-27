import '@server/openapi/zod-extend'
import { z } from 'zod'
import { maintenanceAttachmentSchema } from './maintenance-ticket.schema'

export const maintenanceAttachmentFormSchema = z.object({ file: z.instanceof(File) }).strict()
export const maintenanceAttachmentUploadSchema = z
  .object({
    file: z
      .string()
      .openapi({ format: 'binary', description: 'Imagem JPEG, PNG ou WebP de até 8 MB.' }),
  })
  .strict()
  .openapi('MaintenanceAttachmentUpload')
export const maintenanceAttachmentResponseSchema = z
  .object({ attachment: maintenanceAttachmentSchema })
  .openapi('MaintenanceAttachmentResponse')
export const resolveMaintenanceTicketRequestSchema = z
  .object({})
  .strict()
  .openapi('ResolveMaintenanceTicketRequest')
