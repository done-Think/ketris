import { useTranslations } from 'next-intl'

import { responseTimeParts } from '../utils/team-member'

export function useResponseTimeLabel(minutes: number | null): string | null {
  const t = useTranslations('dashboard.team.duration')
  if (minutes === null) return null
  const parts = responseTimeParts(minutes)

  return parts.unit === 'minutes'
    ? t('minutes', { minutes: parts.minutes })
    : parts.unit === 'hours'
      ? t('hours', { hours: parts.hours, minutes: parts.minutes })
      : t('days', { days: parts.days })
}
