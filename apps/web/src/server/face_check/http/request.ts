import sharp from 'sharp'
import type { z } from 'zod'
import { FaceCheckError } from './errors'
import {
  maxCapturePhotoBytes,
  maxCapturePhotoPixels,
  maxJsonBodyBytes,
  maxUploadBodyBytes,
} from '../config/upload-limits'
import type { CapturedImage } from '../types/face-match.types'
import type { CapturedImageLimits } from '../types/face-framing.types'

export async function readBodyBytes(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get('content-length')) > maxBytes)
    throw new FaceCheckError('PAYLOAD_TOO_LARGE', 413)
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const parts: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.length
      if (size > maxBytes) {
        await reader.cancel()
        throw new FaceCheckError('PAYLOAD_TOO_LARGE', 413)
      }
      parts.push(new Uint8Array(next.value))
    }
  } finally {
    reader.releaseLock()
  }
  return new Uint8Array(await new Blob(parts).arrayBuffer())
}

export async function jsonBody<T>(
  request: Request,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new FaceCheckError('VALIDATION_ERROR', 400)
  const bytes = await readBodyBytes(request, maxJsonBodyBytes)
  let value: unknown
  try {
    value = JSON.parse(Buffer.from(bytes).toString())
  } catch {
    throw new FaceCheckError('VALIDATION_ERROR', 400)
  }
  return schema.parse(value)
}

export async function photoForm(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data;'))
    throw new FaceCheckError('IMAGE_REQUIRED', 400)
  const bytes = await readBodyBytes(request, maxUploadBodyBytes)
  let form: FormData
  try {
    form = await new Response(new Blob([bytes]), {
      headers: { 'Content-Type': contentType },
    }).formData()
  } catch {
    throw new FaceCheckError('VALIDATION_ERROR', 400)
  }
  const entries = [...form.entries()]
  if (entries.some(([, value]) => value instanceof Blob && value.size > maxCapturePhotoBytes))
    throw new FaceCheckError('PAYLOAD_TOO_LARGE', 413)
  if (
    entries.filter(([, value]) => value instanceof Blob).length !== 1 ||
    new Set(entries.map(([key]) => key)).size !== entries.length
  )
    throw new FaceCheckError('VALIDATION_ERROR', 400)
  return Object.fromEntries(entries)
}

export async function capturedImage(
  value: unknown,
  limits: CapturedImageLimits = {
    maxBytes: maxCapturePhotoBytes,
    maxPixels: maxCapturePhotoPixels,
  },
): Promise<CapturedImage> {
  const types: Record<string, string> = { 'image/jpeg': 'jpeg', 'image/png': 'png' }
  if (!(value instanceof Blob) || !types[value.type] || value.size === 0)
    throw new FaceCheckError('INVALID_IMAGE', 400)
  if (value.size > limits.maxBytes) throw new FaceCheckError('PAYLOAD_TOO_LARGE', 413)
  const bytes = Buffer.from(await value.arrayBuffer())
  try {
    const image = sharp(bytes, { limitInputPixels: limits.maxPixels, failOn: 'warning' })
    const metadata = await image.metadata()
    if (
      metadata.format !== types[value.type] ||
      (metadata.pages && metadata.pages > 1) ||
      !metadata.width ||
      !metadata.height ||
      metadata.width < 32 ||
      metadata.height < 32 ||
      metadata.width * metadata.height > limits.maxPixels
    )
      throw new Error('INVALID_IMAGE')
    // Decode all pixels, not only the header, before the engine or object storage receives bytes.
    await image.stats()
  } catch {
    throw new FaceCheckError('INVALID_IMAGE', 400)
  }
  return { bytes: new Uint8Array(bytes), contentType: value.type }
}

export function assertMutationOrigin(request: Request, publicCapture: boolean) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return
  const origin = request.headers.get('origin')
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL
  const expected = configured
    ? new URL(configured).origin
    : process.env.NODE_ENV !== 'production'
      ? new URL(request.url).origin
      : null
  if (
    !expected ||
    (origin ? origin !== expected : publicCapture || !request.headers.has('authorization'))
  )
    throw new FaceCheckError('INVALID_ORIGIN', 403)
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite))
    throw new FaceCheckError('INVALID_ORIGIN', 403)
}
