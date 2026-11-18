'use client'

import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { getColorDotStyles, styles } from '../../styles/agency-brand-editor.styles'
import type {
  AgencyBrandColorField,
  AgencyBrandRequiredField,
  AgencyBrandSummaryCardProps,
} from '../../types/agency-brand-editor'
import { AgencyAdaptiveBrandHeader } from '../AgencyAdaptiveBrandHeader'
import { PublicProfileEditorPanel } from '../public-profile-editor/PublicProfileEditorPanel'

const colorFields: readonly AgencyBrandColorField[] = [
  'backgroundColor',
  'primaryColor',
  'secondaryColor',
]
const requiredToPublish: readonly AgencyBrandRequiredField[] = [
  'backgroundColor',
  'logoUrl',
  'bannerUrl',
]

export function AgencyBrandSummaryCard({
  agency,
  values,
  errors,
  disabled,
  onOpen,
}: AgencyBrandSummaryCardProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const format = useFormatter()
  const errorMessages = requiredToPublish
    .map((field) => errors[field]?.message)
    .filter((message): message is string => Boolean(message))
  const missing = requiredToPublish.filter((field) => !values[field])

  return (
    <PublicProfileEditorPanel title={t('fields.appearance')}>
      <Box sx={styles.summary}>
        <Box sx={styles.summaryPreview}>
          <AgencyAdaptiveBrandHeader agency={agency} variant="compact" showBanner />
        </Box>
        <Box sx={styles.summaryInfo}>
          <Box sx={styles.summaryDots}>
            {colorFields.map((field) => (
              <Tooltip key={field} title={t(`fields.${field}`)}>
                <Box
                  role="img"
                  aria-label={`${t(`fields.${field}`)}: ${values[field] || t('brand.emptyColor')}`}
                  sx={getColorDotStyles(values[field])}
                />
              </Tooltip>
            ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<PaletteOutlinedIcon />}
            onClick={onOpen}
            disabled={disabled}
          >
            {t('brand.open')}
          </Button>
        </Box>
      </Box>
      <Stack spacing={0.4} sx={styles.summaryStatus}>
        <Typography sx={styles.colorHelp}>{t('brand.summaryDescription')}</Typography>
        {errorMessages.length > 0 ? (
          errorMessages.map((message) => (
            <Typography key={message} sx={styles.summaryMissing}>
              {message}
            </Typography>
          ))
        ) : missing.length > 0 ? (
          <Typography sx={styles.colorHelp}>
            {t('brand.missingHint', {
              items: format.list(
                missing.map((field) => t(`brand.missingItems.${field}`)),
                { type: 'conjunction' },
              ),
            })}
          </Typography>
        ) : (
          <Typography sx={styles.summaryReady}>{t('brand.ready')}</Typography>
        )}
      </Stack>
    </PublicProfileEditorPanel>
  )
}
