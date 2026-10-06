'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { DashboardPropertyMappingOptions } from '../types/dashboard-property'

export function useDashboardPropertyMappingOptions(): DashboardPropertyMappingOptions {
  const locale = useLocale()
  const t = useTranslations('properties.dashboard.mapping')

  return useMemo(
    () => ({
      locale,
      messages: {
        notAnnounced: t('notAnnounced'),
        notInformed: t('notInformed'),
        unknownAddress: t('unknownAddress'),
        monthlySuffix: t('monthlySuffix'),
        purposes: {
          rent: t('purposes.rent'),
          sale: t('purposes.sale'),
        },
        activity: {
          created: t('activity.created'),
          published: t('activity.published'),
          updated: t('activity.updated'),
        },
      },
    }),
    [locale, t],
  )
}
