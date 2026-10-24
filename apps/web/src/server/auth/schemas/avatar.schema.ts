import '@server/openapi/zod-extend'
import { z } from 'zod'

export const avatarUploadSchema = z
  .object({
    file: z
      .string()
      .openapi({ format: 'binary', description: 'Imagem JPEG, PNG ou WebP até 8 MiB.' }),
  })
  .openapi('AvatarUploadRequest')
export const avatarUploadResponseSchema = z
  .object({
    media: z.object({
      url: z.string(),
      contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }),
  })
  .openapi('AvatarUploadResponse')
export const avatarMediaParamsSchema = z.object({
  key: z.string().openapi({ example: 'avatars/tenant/user/photo.png' }),
})
export const avatarBinarySchema = z.string().openapi({ format: 'binary' })

export const avatarMediaSegmentsSchema = z
  .array(
    z
      .string()
      .min(1)
      .refine((part) => part !== '.' && part !== '..' && !/[\\/%]/.test(part)),
  )
  .length(4)
  .refine((segments) => segments[0] === 'avatars')
