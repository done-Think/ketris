import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import { instagramContainer } from '@server/instagram/container'
import { instagramActor } from '@server/instagram/http/auth'
import { publicationResponse } from '@server/instagram/http/publication-response'
import { getInstagramConfig, instagramRequestMediaWaitMs } from '@server/instagram/config'
import { instagramPublicationSchema } from '@server/instagram/schemas/publication.schema'
import type { InstagramPropertyContext } from '@server/instagram/types/http'

export const runtime = 'nodejs'
export const maxDuration = 120
export const GET = withErrorHandling(
  async (request: NextRequest, context: InstagramPropertyContext) => {
    const actor = await instagramActor(request)
    getInstagramConfig()
    const { propertyId } = await context.params
    return NextResponse.json(
      {
        publications: (await instagramContainer.list.execute(actor, propertyId)).map(
          publicationResponse,
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  },
)

export const POST = withErrorHandling(
  async (request: NextRequest, context: InstagramPropertyContext) => {
    const actor = await instagramActor(request)
    getInstagramConfig()
    const { propertyId } = await context.params
    const body = await parseJsonBody(request, instagramPublicationSchema)
    const job = await instagramContainer.queue.execute(
      actor,
      propertyId,
      body.caption,
      body.imageUrls,
    )
    after(async () => {
      try {
        await instagramContainer.process.execute(job.id, {
          waitForMediaMs: instagramRequestMediaWaitMs,
        })
      } catch {}
    })
    return NextResponse.json({ publication: publicationResponse(job) }, { status: 202 })
  },
)
