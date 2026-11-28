'use client'

import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { agencyBrandRequiredFields, agencyBrandReviewKeys } from '../../config/agency-brand-fields'
import { styles } from '../../styles/agency-brand-editor.styles'
import type { AgencyBrandReviewProps } from '../../types/agency-brand-editor'
import { isAgencyBrandFieldReady } from '../../utils/agency-public-profile-editor-adapter'

export function AgencyBrandReview({ values }: AgencyBrandReviewProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand.wizard.review')
  const checks = agencyBrandRequiredFields.map((field) => ({
    key: agencyBrandReviewKeys[field],
    ok: isAgencyBrandFieldReady(field, values),
  }))

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
