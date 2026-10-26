import '@server/openapi/zod-extend'
import { z } from 'zod'
import {
  MAINTENANCE_ATTACHMENT_MAX_BYTES,
  MAINTENANCE_ATTACHMENT_TYPES,
} from '../config/attachment-limits'

export const maintenanceUploadMetadataSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.enum(MAINTENANCE_ATTACHMENT_TYPES),
    size: z.number().int().min(1).max(MAINTENANCE_ATTACHMENT_MAX_BYTES),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .openapi('MaintenanceUploadMetadata')
export const maintenanceUploadDescriptorSchema = maintenanceUploadMetadataSchema
  .extend({
    uploadId: z.string().uuid(),
    actorId: z.string().min(1),
    tenantId: z.string().min(1),
    ticketId: z.string().min(1),
  })
  .strict()
export const maintenancePrepareUploadResponseSchema = z
  .object({
    upload: z.object({ url: z.string().url(), headers: z.record(z.string()) }),
    token: z.string(),
  })
  .openapi('MaintenancePrepareUploadResponse')
export const maintenanceCompleteUploadRequestSchema = z
  .object({ token: z.string().min(1).max(10000) })
  .strict()
  .openapi('MaintenanceCompleteUploadRequest')
