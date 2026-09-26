import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import type { ProfileMediaTarget } from '@server/marketplace/application/use-cases/upload-profile-media.use-case'
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
    throw new RequestValidationError([{ path: 'file', message: 'Envie um arquivo em "file".' }])
  }

  if (!isProfileMediaTarget(target)) {
    throw new RequestValidationError([
      { path: 'target', message: 'Informe um destino válido em "target".' },
    ])
  }

  const body = Buffer.from(await file.arrayBuffer())

  const media = await marketplaceContainer.uploadProfileMediaUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    target,
    filename: file.name,
    contentType: file.type,
    body,
  })

  return NextResponse.json({ media }, { status: 201 })
})
