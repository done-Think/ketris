'use client'

import { Box, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { surface } from '@shared/theme/tokens'

import { getColorSwatchStyles, styles } from '../../styles/agency-brand-editor.styles'
import type { AgencyBrandColorFieldProps } from '../../types/agency-brand-editor'
import { isHexColor } from '../../utils/brand-color-contrast'

export function AgencyBrandColorField({ control, name, onHighlight }: AgencyBrandColorFieldProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const label = t(`fields.${name}`)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Box
          sx={styles.colorRow}
          onMouseEnter={() => onHighlight(name)}
          onMouseLeave={() => onHighlight(null)}
        >
          <Box sx={getColorSwatchStyles(isHexColor(field.value) ? field.value : '')}>
            <Box
              component="input"
              type="color"
              aria-label={t('brand.pickColor', { name: label })}
              value={isHexColor(field.value) ? field.value : surface.paper}
              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              sx={styles.colorPicker}
            />
          </Box>
          <Box sx={styles.colorText}>
            <TextField
              {...field}
              size="small"
              label={label}
              placeholder={t('brand.emptyColor')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              slotProps={{ htmlInput: { maxLength: 7, spellCheck: false } }}
              onChange={(event) => field.onChange(event.target.value.trim().toUpperCase())}
            />
            {name === 'backgroundColor' ? (
              <Typography sx={styles.requiredTag}>{t('brand.requiredToPublish')}</Typography>
            ) : null}
            <Typography sx={styles.colorHelp}>{t(`brand.colorHelp.${name}`)}</Typography>
          </Box>
        </Box>
      )}
    />
  )
}
