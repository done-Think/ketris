'use client'

import { Alert, Box, ButtonBase, Stack, Tooltip, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { agencyBrandPalettes } from '../../config/agency-brand-palettes'
import {
  getPaletteButtonStyles,
  getPaletteColorStyles,
  styles,
} from '../../styles/agency-brand-editor.styles'
import type {
  AgencyBrandColorField as AgencyBrandColorFieldName,
  AgencyBrandColorFieldsProps,
} from '../../types/agency-brand-editor'
import { findBrandContrastIssues } from '../../utils/brand-color-contrast'
import { AgencyBrandColorField } from './AgencyBrandColorField'

const colorFields: readonly AgencyBrandColorFieldName[] = [
  'backgroundColor',
  'primaryColor',
  'secondaryColor',
]

export function AgencyBrandColorFields({
  control,
  values,
  onApplyPalette,
  onHighlight,
}: AgencyBrandColorFieldsProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand')
  const format = useFormatter()
  const contrastIssues = findBrandContrastIssues(values)

  return (
    <Box sx={styles.section}>
      <Typography sx={styles.sectionTitle}>{t('colors')}</Typography>
      <Typography sx={styles.colorHelp}>{t('palettes')}</Typography>
      <Box sx={styles.palettes}>
        {agencyBrandPalettes.map((palette) => {
          const name = t(`paletteNames.${palette.id}`)
          const selected = colorFields.every((field) => values[field] === palette[field])

          return (
            <Tooltip key={palette.id} title={name}>
              <ButtonBase
                aria-label={t('applyPalette', { name })}
                aria-pressed={selected}
                onClick={() => onApplyPalette(palette)}
                sx={getPaletteButtonStyles(selected)}
              >
                {colorFields.map((field) => (
                  <Box key={field} sx={getPaletteColorStyles(palette[field])} />
                ))}
              </ButtonBase>
            </Tooltip>
          )
        })}
      </Box>
      <Stack spacing={0.5}>
        {colorFields.map((field) => (
          <AgencyBrandColorField
            key={field}
            control={control}
            name={field}
            onHighlight={onHighlight}
          />
        ))}
      </Stack>
      {contrastIssues.map((issue) => (
        <Alert key={issue.kind} severity="warning">
          {t(`contrast.${issue.kind}`, {
            ratio: format.number(issue.ratio, { maximumFractionDigits: 1 }),
            suggestion: issue.suggestion,
          })}
        </Alert>
      ))}
    </Box>
  )
}
