import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { getInstagramConfig } from '../config'
import { InstagramError } from '../domain/errors'
import { mediaSignature } from './token-vault'
import type { InstagramMedia } from '../application/ports/instagram-api.port'

export class S3InstagramMedia implements InstagramMedia {
  async remove(keys: string[]) {
    for (let index = 0; index < keys.length; index += 1000) {
      const response = await getS3Client().send(
        new DeleteObjectsCommand({
          Bucket: getUploadsBucketName(),
          Delete: { Objects: keys.slice(index, index + 1000).map((Key) => ({ Key })), Quiet: true },
        }),
      )
      if (response.Errors?.length)
        throw new InstagramError('INSTAGRAM_MEDIA_DELETION_FAILED', undefined, 503)
    }
  }
  async prepare(tenantId: string, jobId: string, urls: string[]) {
    const config = getInstagramConfig()
    const keys: string[] = []
    for (const [index, source] of urls.entries()) {
      const url = new URL(source, config.mediaOrigin)
      const prefix = '/api/properties/media/'
      const key = decodeURIComponent(url.pathname.slice(prefix.length))
      if (
        url.origin !== config.mediaOrigin ||
        !url.pathname.startsWith(prefix) ||
        !key.startsWith(`properties/${tenantId}/`)
      ) {
        throw new InstagramError(
          'INSTAGRAM_UNSUPPORTED_MEDIA',
          'Envie novamente a foto pelo cadastro do imóvel.',
        )
      }
      const object = await getS3Client().send(
        new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: key }),
      )
      if (!object.Body || !object.ContentLength || object.ContentLength > 12 * 1024 * 1024)
        throw new InstagramError('INSTAGRAM_INVALID_IMAGE')
      const body = await object.Body.transformToByteArray()
      const output = await sharp(body, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize(1080, 1080, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toColourspace('srgb')
        .jpeg({ quality: 85 })
        .toBuffer()
      if (output.length > 8 * 1024 * 1024) throw new InstagramError('INSTAGRAM_IMAGE_TOO_LARGE')
      const preparedKey = `properties/${tenantId}/instagram/${jobId}/${index}.jpg`
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: getUploadsBucketName(),
          Key: preparedKey,
          Body: output,
          ContentType: 'image/jpeg',
        }),
      )
      keys.push(preparedKey)
    }
    return keys
  }
  url(jobId: string, index: number) {
    const expires = Math.floor(Date.now() / 1000) + 48 * 3600
    const path = `${jobId}/${index}/${expires}`
    return `${getInstagramConfig().mediaOrigin}/api/instagram/media/${jobId}/${index}?expires=${expires}&signature=${mediaSignature(path)}`
  }
}
