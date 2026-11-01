import { createHmac } from 'node:crypto'
import type { FaceCheckDatabase } from '../types/access'
import { FaceCheckError } from '../http/errors'

export class CaptureRateLimit {
  constructor(
    private readonly database: FaceCheckDatabase,
    private readonly key: Buffer,
    private readonly clock = Date.now,
  ) {}

  async consume(ip: string, token: string, upload: boolean) {
    const now = this.clock()
    const minute = Math.floor(now / 60_000)
    const limits: [string, string, number][] = [
      ['ip', ip, upload ? 40 : 240],
      ['token', token, upload ? 30 : 180],
    ]
    for (const [kind, value, max] of limits) {
      const key = createHmac('sha256', this.key)
        .update(`${kind}:${upload ? 'upload' : 'all'}:${minute}:${value}`)
        .digest('hex')
      const row = await this.database.faceCheckRateLimit.upsert({
        where: { key },
        create: { key, expiresAt: new Date((minute + 2) * 60_000), count: 1 },
        update: { count: { increment: 1 } },
        select: { count: true },
      })
      if (row.count > max) throw new FaceCheckError('RATE_LIMITED', 429)
    }
    // Indexed and bounded to expired windows; never store raw addresses or tokens.
    await this.database.faceCheckRateLimit.deleteMany({
      where: { expiresAt: { lt: new Date(now) } },
    })
  }
}
