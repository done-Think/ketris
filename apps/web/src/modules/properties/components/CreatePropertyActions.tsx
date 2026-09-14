import { Button, Stack } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useTranslations } from 'next-intl'

import { iconSize, radius } from '@shared/theme/tokens'

import type { CreatePropertyActionsProps } from '../types/dashboard-property'

export function CreatePropertyActions({
  firstStep,
  lastStep,
  onPreviousStep,
  onNextStep,
}: CreatePropertyActionsProps) {
  const t = useTranslations('properties.create')

  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.2}>
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        startIcon={<ChevronLeftRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        disabled={firstStep}
        onClick={onPreviousStep}
        sx={{
          minHeight: 40,
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          fontWeight: 900,
        }}
      >
        {t('back')}
      </Button>
      <Button
        type={lastStep ? 'submit' : 'button'}
        variant="contained"
        endIcon={!lastStep ? <ChevronRightRoundedIcon sx={{ fontSize: iconSize.sm }} /> : null}
        onClick={lastStep ? undefined : onNextStep}
        sx={{
          minHeight: 40,
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          fontWeight: 900,
        }}
      >
        {lastStep ? t('publish') : t('next')}
      </Button>
    </Stack>
  )
}
