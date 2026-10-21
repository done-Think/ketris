'use client'

import { useState } from 'react'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { IconButton, InputAdornment } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { brand } from '@shared/theme/tokens'
import type { RhfTextFieldProps } from '@shared/types'

import { RhfTextField } from './RhfTextField'

export function RhfPasswordField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ label, InputProps, ...props }: Omit<RhfTextFieldProps<TFieldValues, TName>, 'type'>) {
  const t = useTranslations('common.passwordVisibility')
  const [isVisible, setIsVisible] = useState(false)
  const field = typeof label === 'string' ? label : ''

  return (
    <RhfTextField
      {...props}
      label={label}
      type={isVisible ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={t(isVisible ? 'hide' : 'show', { field })}
              aria-pressed={isVisible}
              edge="end"
              onClick={() => setIsVisible((current) => !current)}
              sx={{ color: brand.neutral[500] }}
            >
              {isVisible ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
