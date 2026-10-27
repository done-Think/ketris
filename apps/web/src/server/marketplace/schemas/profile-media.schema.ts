import '@server/openapi/zod-extend'
import { z } from 'zod'

export const profileMediaTargetSchema = z
  .enum(['broker-avatar', 'broker-banner', 'agency-logo', 'agency-banner'])
  .openapi('ProfileMediaTarget')

export const profileMediaUploadRequestSchema = z
  .object({
    file: z
      .string()
      .openapi({ format: 'binary', description: 'Imagem JPEG, PNG ou WebP até 8 MiB.' }),
    target: profileMediaTargetSchema,
  })
  .strict()
  .openapi('ProfileMediaUploadRequest')

export const profileMediaUploadResponseSchema = z
  .object({
    media: z.object({ url: z.string(), contentType: z.string() }),
  })
  .openapi('ProfileMediaUploadResponse')

export const profileMediaKeyParamsSchema = z.object({
  key: z.string().openapi({
    description:
      'Chave completa sob profiles/brokers/<id>/<arquivo> ou profiles/agencies/<id>/<arquivo>.',
    example: 'profiles/brokers/user-id/avatar-image.jpg',
  }),
})

export const profileMediaBinarySchema = z.string().openapi({ format: 'binary' })
