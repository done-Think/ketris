import { useTranslations } from 'next-intl'

import type { CaptureSessionView } from '../types'

export function useAgencyName(session: CaptureSessionView) {
  const t = useTranslations('face_check.capture')

  return session.agencyName.trim() || t('agencyFallback')
}
