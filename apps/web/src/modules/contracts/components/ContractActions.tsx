import { styles } from '../styles/contract-actions.styles'
import { Button, CircularProgress, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { ContractActionsProps } from '../types/contract'

export function ContractActions({
  lastStep,
  isSubmitting,
  onPreviousStep,
  onNextStep,
}: ContractActionsProps) {
  const t = useTranslations('contracts.wizard.actions')

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={styles.stack}
    >
      <Button variant="outlined" onClick={onPreviousStep} sx={styles.button}>
        {t('back')}
      </Button>
      <Button
        variant="contained"
        onClick={onNextStep}
        disabled={lastStep && isSubmitting}
        startIcon={lastStep && isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        sx={styles.button2}
      >
        {lastStep ? t('generate') : t('next')}
      </Button>
    </Stack>
  )
}
