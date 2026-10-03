import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

/**
 * Só quem tem papel AGENT pode ter/editar um perfil público de corretor — ADMIN/OWNER (inclusive
 * autônomos) são representados via perfil de imobiliária do próprio tenant, não como corretor
 * individual. RENTER nunca chega aqui (bloqueado antes, no layout do dashboard).
 */
export function assertBrokerProfileAccess(actorPapel: Papel): void {
  if (actorPapel !== 'AGENT') {
    throw new ForbiddenError('Só corretores (papel AGENT) têm perfil público de corretor.')
  }
}

/**
 * Só ADMIN/OWNER editam o perfil público da imobiliária (marca, equipe em destaque) — um AGENT
 * comum edita só o próprio perfil de corretor.
 */
export function assertAgencyProfileAccess(actorPapel: Papel): void {
  if (actorPapel !== 'ADMIN' && actorPapel !== 'OWNER') {
    throw new ForbiddenError('Só administradores da imobiliária editam o perfil público dela.')
  }
}
