import { validationIssue } from '@server/shared/http/validation-messages'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import type { ProfileMediaTarget } from '@server/marketplace/types/use-case-inputs'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

const validTargets = new Set<ProfileMediaTarget>([
  'broker-avatar',
  'broker-banner',
  'agency-logo',
  'agency-banner',
])

function isProfileMediaTarget(value: unknown): value is ProfileMediaTarget {
  return typeof value === 'string' && validTargets.has(value as ProfileMediaTarget)
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const formData = await request.formData()
  const file = formData.get('file')
  const target = formData.get('target')

  if (!(file instanceof File)) {
    throw new RequestValidationError([validationIssue('file', 'fileRequired')])
  }

  if (!isProfileMediaTarget(target)) {
    throw new RequestValidationError([validationIssue('target', 'targetRequired')])
  }

  const body = Buffer.from(await file.arrayBuffer())

  const media = await marketplaceContainer.uploadProfileMediaUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorRole: actor.role,
    target,
    filename: file.name,
    contentType: file.type,
    body,
  })

  return NextResponse.json({ media }, { status: 201 })
})
