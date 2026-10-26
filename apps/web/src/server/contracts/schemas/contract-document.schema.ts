import '@server/openapi/zod-extend'
import { z } from 'zod'
import { CONTRACT_DOCUMENT_MAX_BYTES } from '../config/document-limits'
import { contractDocumentSchema } from './contract.schema'

export const initContractDocumentRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine((name) => !/[\r\n\0]/.test(name), 'Nome de arquivo inválido.'),
    size: z.number().int().positive().max(CONTRACT_DOCUMENT_MAX_BYTES),
    sha256: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-f0-9]{64}$/),
  })
  .strict()
  .openapi('InitContractDocumentRequest')

export const contractDocumentDescriptorSchema = initContractDocumentRequestSchema
  .extend({
    id: z.string().min(1),
    tenantId: z.string().min(1),
    contractId: z.string().min(1),
    actorId: z.string().min(1),
    dataRevision: z.number().int().nonnegative(),
  })
  .strict()

export const confirmContractDocumentRequestSchema = z
  .object({ uploadToken: z.string().min(1).max(8000) })
  .strict()
  .openapi('ConfirmContractDocumentRequest')
export const contractDocumentParamsSchema = z
  .object({ id: z.string().min(1), documentId: z.string().min(1) })
  .strict()
  .openapi('ContractDocumentParams')
export const contractDocumentUploadResponseSchema = z
  .object({
    uploadUrl: z.string().url(),
    headers: z.record(z.string()),
    uploadToken: z.string(),
    expiresAt: z.string(),
  })
  .openapi('ContractDocumentUploadResponse')
export const contractDocumentResponseSchema = z
  .object({ document: contractDocumentSchema })
  .openapi('ContractDocumentResponse')
export const contractDocumentDownloadResponseSchema = z
  .object({ url: z.string().url(), expiresAt: z.string() })
  .openapi('ContractDocumentDownloadResponse')
