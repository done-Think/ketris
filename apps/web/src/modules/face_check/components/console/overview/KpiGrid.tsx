'use client'

import { Box, Typography } from '@mui/material'
import { useFormatter, useNow, useTranslations } from 'next-intl'

import type { KpiItem, OverviewSectionProps } from '../../../types/console.types'
import { overviewStyles as styles } from '../../../styles/console.styles'

export function KpiGrid({ overview }: OverviewSectionProps) {
  const t = useTranslations('face_check.console.overview.kpis')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60 * 1000 })
  const median = overview.medianDecisionSeconds

  const items: KpiItem[] = [
    {
      key: 'completed',
      value: format.number(overview.completed),
      caption: t('completed.caption'),
    },
    {
      key: 'autoApproval',
      value: format.number(overview.completed ? overview.approved / overview.completed : 0, {
        style: 'percent',
        maximumFractionDigits: 1,
      }),
      caption: t('autoApproval.caption', {
        approved: overview.approved,
        total: overview.completed,
      }),
    },
    {
      key: 'inReview',
      value: format.number(overview.inReview),
      caption: overview.oldestReviewAt
        ? t('inReview.caption', {
            since: format.relativeTime(new Date(overview.oldestReviewAt), now),
          })
        : t('inReview.empty'),
    },
    {
      key: 'decisionTime',
      value:
        median === null
          ? t('emptyValue')
          : t('decisionTime.value', { minutes: Math.floor(median / 60), seconds: median % 60 }),
      caption: t('decisionTime.caption'),
    },
    { key: 'redo', value: format.number(overview.redoRequests), caption: t('redo.caption') },
  ]

  return (
    <Box component="section" aria-label={t('label')} sx={styles.kpiGrid}>
      {items.map((item) => (
        <Box key={item.key} sx={styles.kpiCard}>
          <Typography sx={styles.kpiLabel}>{t(`${item.key}.label`)}</Typography>
          <Typography sx={styles.kpiValue}>{item.value}</Typography>
          <Typography sx={styles.kpiCaption}>{item.caption}</Typography>
        </Box>
      ))}
    </Box>
  )
}
