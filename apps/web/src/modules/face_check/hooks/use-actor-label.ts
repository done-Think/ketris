import { useTranslations } from 'next-intl'

import type { TimelineEvent, VerificationSession } from '../types'

const actorKeys = ['system', 'operator'] as const

export function useActorLabel(session: VerificationSession) {
  const t = useTranslations('face_check.console.detail.timeline.actors')

  return (actor: TimelineEvent['actor']) => {
    if (actor === 'person') return session.personName
    const key = actorKeys.find((item) => item === actor)

    return key ? t(key) : actor
  }
}
