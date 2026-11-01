import type { EvidenceKind } from '@server/face_check/types/session.types'
import type { z } from 'zod'

import { VerificationError } from '../verification/domain/verification-error'
import { documentRegionsResultSchema } from '../schemas/document-import.schemas'

import {
  faceMatchResultSchema,
  faceFramingSchema,
  livenessResultSchema,
  livenessProximitySchema,
  photoInspectionSchema,
} from '../schemas/face-match.schemas'
import type {
  ExpectedPerson,
  FaceEngine,
  FaceMatchResult,
  LivenessFrame,
  LivenessResult,
  PhotoInspection,
} from '../types/face-match.types'

const defaultTimeoutMs = 60_000

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64')
}

export class HttpFaceEngine implements FaceEngine {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = defaultTimeoutMs,
    private readonly serviceToken: string = '',
  ) {}

  async framing(image: Uint8Array) {
    return this.post(
      '/framing',
      { image: toBase64(image) },
      faceFramingSchema,
      Math.min(this.timeoutMs, 2500),
    )
  }

  async proximity(selfie: Uint8Array, image: Uint8Array) {
    return this.post(
      '/proximity',
      { selfie: toBase64(selfie), image: toBase64(image) },
      livenessProximitySchema,
      Math.min(this.timeoutMs, 3000),
    )
  }

  async documentRegions(image: Uint8Array) {
    return this.post('/document-regions', { image: toBase64(image) }, documentRegionsResultSchema)
  }

  async match(document: Uint8Array, selfie: Uint8Array): Promise<FaceMatchResult> {
    return this.post(
      '/match',
      { document: toBase64(document), selfie: toBase64(selfie) },
      faceMatchResultSchema,
    )
  }

  async inspect(
    kind: EvidenceKind,
    image: Uint8Array,
    expected: ExpectedPerson,
  ): Promise<PhotoInspection> {
    return this.post('/inspect', { kind, image: toBase64(image), expected }, photoInspectionSchema)
  }

  async verifyLiveness(selfie: Uint8Array, frames: LivenessFrame[]): Promise<LivenessResult> {
    return this.post(
      '/liveness',
      {
        selfie: toBase64(selfie),
        frames: frames.map((frame) => ({
          challenge: frame.challenge,
          image: toBase64(frame.image),
        })),
      },
      livenessResultSchema,
    )
  }

  private async post<Output>(
    path: string,
    payload: Record<string, unknown>,
    schema: z.ZodType<Output, z.ZodTypeDef, unknown>,
    timeoutMs = this.timeoutMs,
  ): Promise<Output> {
    const signal = AbortSignal.timeout(timeoutMs)
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
        signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new VerificationError('ANALYSIS_FAILED')
      try {
        return schema.parse(await response.json())
      } catch (error) {
        if (signal.aborted) throw error
        throw new VerificationError('ANALYSIS_INVALID_RESPONSE')
      }
    } catch (error) {
      if (signal.aborted) throw new VerificationError('ANALYSIS_TIMEOUT')
      if (error instanceof VerificationError) throw error
      throw new VerificationError('ANALYSIS_UNAVAILABLE')
    }
  }
}
