import type { MaintenanceMediaRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'

import { getS3Client, getUploadsBucketName } from '@server/shared/storage/s3-client'
import { withErrorHandling } from '@server/shared/http'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceContainer } from '@server/maintenance/container'
import { assertTicketAccess } from '@server/maintenance/application/authorization'
import { MaintenanceTicketNotFoundError } from '@server/maintenance/domain/errors'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceMediaRouteContext) => {
    const actor = await requireMaintenanceActor(request, true)
    const { key } = await context.params
    const objectKey = key.join('/')
    if (
      key[0] !== 'maintenance' ||
      key[1] !== actor.actorTenantId ||
      key.some((part) => part === '..' || part === '.')
    )
      throw new MaintenanceTicketNotFoundError()
    const ticket = await maintenanceContainer.repository.findAttachmentTicket(
      actor.actorTenantId,
      `/api/maintenance/media/${objectKey}`,
    )
    assertTicketAccess(actor, ticket)

    try {
      const object = await getS3Client().send(
        new GetObjectCommand({ Bucket: getUploadsBucketName(), Key: objectKey }),
      )
      const body = await object.Body?.transformToByteArray()

      if (!body) {
        return new NextResponse(null, { status: 404 })
      }

      return new NextResponse(Buffer.from(body), {
        status: 200,
        headers: {
          'Content-Type': object.ContentType ?? 'application/octet-stream',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return new NextResponse(null, { status: 404 })
      }

      throw error
    }
  },
)
