'use client'

import { Box, Typography } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useTranslations } from 'next-intl'
import type { PropertyNegotiationSummaryProps } from '@shared/types/property-negotiation'
import { styles } from '@shared/styles/property-negotiation-summary.styles'

export function PropertyNegotiationSummary({
  conditions = [],
  observation,
}: PropertyNegotiationSummaryProps) {
  const t = useTranslations('common.propertyNegotiation')
  if (conditions.length === 0 && !observation?.trim()) return null

  return (
    <Box component="section" aria-label={t('title')} sx={styles.section}>
      <Typography component="h2" variant="h6" sx={styles.title}>
        {t('title')}
      </Typography>
      {conditions.length > 0 ? (
        <Box component="ul" sx={styles.list}>
          {conditions.map((condition) => (
            <Box component="li" key={condition} sx={styles.item}>
              <CheckCircleOutlineRoundedIcon sx={styles.icon} />
              <Typography>{t(`options.${condition}`)}</Typography>
            </Box>
          ))}
        </Box>
      ) : null}
      {observation?.trim() ? (
        <Box sx={styles.observationSection}>
          <Typography variant="caption" color="text.secondary">
            {t('observation')}
          </Typography>
          <Typography sx={styles.observation}>{observation}</Typography>
        </Box>
      ) : null}
    </Box>
  )
}
