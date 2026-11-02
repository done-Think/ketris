import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { purgeFaceCheckEvidence } from '@server/face_check/purge'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const secret = process.env.FACE_CHECK_RETENTION_SECRET ?? process.env.CRON_SECRET
  const actual = request.headers.get('authorization') ?? ''
  const digest = (value: string) => createHash('sha256').update(value).digest()
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
  if (!secret || Buffer.byteLength(secret) < 32) {
    return NextResponse.json(
      { error: { code: 'RETENTION_NOT_CONFIGURED' } },
      { status: 503, headers },
    )
  }
  if (!timingSafeEqual(digest(actual), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401, headers })
  }
  try {
    const result = await purgeFaceCheckEvidence({ limit: 50 })
    return NextResponse.json(result, { status: result.failed > 0 ? 503 : 200, headers })
  } catch {
    return NextResponse.json({ error: { code: 'RETENTION_UNAVAILABLE' } }, { status: 503, headers })
  }
}
