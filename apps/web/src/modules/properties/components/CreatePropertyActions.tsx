import { styles, getPreviousButtonStyles } from '../styles/create-property-actions.styles'
import { Button, Stack } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useTranslations } from 'next-intl'

import type { CreatePropertyActionsProps } from '../types/dashboard-property'

export function CreatePropertyActions({
  firstStep,
  lastStep,
  isSubmitting,
  isUploading = false,
  onPreviousStep,
  onNextStep,
  submitLabel,
}: CreatePropertyActionsProps) {
  const t = useTranslations('properties.create')

  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.2} sx={styles.stack}>
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        startIcon={<ChevronLeftRoundedIcon sx={styles.chevronLeftRoundedIcon} />}
        disabled={firstStep}
        onClick={onPreviousStep}
        sx={getPreviousButtonStyles(firstStep)}
      >
        {t('back')}
      </Button>
      <Button
        key={lastStep ? 'submit' : 'next'}
        type={lastStep ? 'submit' : 'button'}
        variant="contained"
        endIcon={!lastStep ? <ChevronRightRoundedIcon sx={styles.chevronRightRoundedIcon} /> : null}
        onClick={lastStep ? undefined : onNextStep}
        disabled={isUploading || (lastStep && isSubmitting)}
        sx={styles.button}
      >
        {lastStep ? (submitLabel ?? t('publish')) : t('next')}
      </Button>
    </Stack>
  )
}
