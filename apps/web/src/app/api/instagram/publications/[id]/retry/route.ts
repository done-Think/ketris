import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { instagramActor } from '@server/instagram/http/auth'
import { instagramContainer } from '@server/instagram/container'
import { getInstagramConfig, instagramRequestMediaWaitMs } from '@server/instagram/config'
import type { InstagramPublicationContext } from '@server/instagram/types/http'

export const runtime = 'nodejs'
export const maxDuration = 120
export const POST = withErrorHandling(
  async (request: NextRequest, context: InstagramPublicationContext) => {
    const actor = await instagramActor(request)
    getInstagramConfig()
    const { id } = await context.params
    await instagramContainer.retry.execute(actor, id)
    after(async () => {
      try {
        await instagramContainer.process.execute(id, {
          waitForMediaMs: instagramRequestMediaWaitMs,
        })
      } catch {}
    })
    return NextResponse.json({ queued: true }, { status: 202 })
  },
)
