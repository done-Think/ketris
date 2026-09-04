import { Button, Stack } from '@mui/material'

import { brand, radius, shadows } from '@shared/theme/tokens'

import type { ContractActionsProps } from '../types/contract'

export function ContractActions({ lastStep, onPreviousStep, onNextStep }: ContractActionsProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ mt: { xs: 3, md: 5.2 } }}
    >
      <Button
        variant="outlined"
        onClick={onPreviousStep}
        sx={{
          borderColor: brand.neutral[200],
          color: brand.graphite[500],
          borderRadius: `${radius.sm}px`,
          px: 2.4,
          py: 1,
          fontSize: 12,
          fontWeight: 900,
          textTransform: 'none',
        }}
      >
        Voltar
      </Button>
      <Button
        variant="contained"
        onClick={onNextStep}
        sx={{
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          px: { xs: 2.4, md: 3 },
          py: 1.1,
          fontSize: 12,
          fontWeight: 900,
          textTransform: 'none',
        }}
      >
        {lastStep ? 'Gerar contrato' : 'Próximo passo'}
      </Button>
    </Stack>
  )
}
