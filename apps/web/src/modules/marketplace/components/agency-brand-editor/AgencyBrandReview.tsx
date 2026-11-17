'use client'

import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/agency-brand-editor.styles'
import type { AgencyBrandReviewProps } from '../../types/agency-brand-editor'

export function AgencyBrandReview({ values }: AgencyBrandReviewProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand.wizard.review')
  const checks = [
    { key: 'logo', ok: Boolean(values.logoUrl) },
    { key: 'background', ok: Boolean(values.backgroundColor) },
    { key: 'cover', ok: Boolean(values.bannerUrl) },
  ] as const

  return (
    <Stack spacing={1.2} component="ul" sx={styles.reviewList}>
      {checks.map((check) => (
        <Box component="li" key={check.key} sx={styles.reviewItem}>
          {check.ok ? (
            <CheckCircleOutlineRoundedIcon fontSize="small" sx={styles.reviewOk} />
          ) : (
            <ErrorOutlineRoundedIcon fontSize="small" sx={styles.reviewWarn} />
          )}
          <Typography>{t(`${check.key}.${check.ok ? 'ok' : 'missing'}`)}</Typography>
        </Box>
      ))}
    </Stack>
  )
}
