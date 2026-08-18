import { Button, Stack } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

import { componentText, iconSize, radius } from '@shared/theme/tokens'

import type { CreatePropertyActionsProps } from '../types/dashboard-property'

export function CreatePropertyActions({
  firstStep,
  lastStep,
  isSubmitting,
  onPreviousStep,
  onNextStep,
}: CreatePropertyActionsProps) {
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
          ...componentText.dashboardActionLabel,
        }}
      >
        Voltar
      </Button>
      <Button
        type={lastStep ? 'submit' : 'button'}
        variant="contained"
        disabled={isSubmitting}
        endIcon={!lastStep ? <ChevronRightRoundedIcon sx={{ fontSize: iconSize.sm }} /> : null}
        onClick={lastStep ? undefined : onNextStep}
        sx={{
          minHeight: 40,
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          ...componentText.dashboardActionLabel,
        }}
      >
        {lastStep ? 'Publicar' : 'Próximo'}
      </Button>
    </Stack>
  )
}
