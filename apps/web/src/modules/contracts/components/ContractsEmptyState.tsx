import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { ContractsEmptyStateProps } from '../types/contract'

export function ContractsEmptyState({ onCreateContract }: ContractsEmptyStateProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.6}
      sx={{
        minHeight: 320,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        textAlign: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 54,
          height: 54,
          borderRadius: radius.full,
          bgcolor: alpha.magenta[8],
          color: brand.magenta[500],
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: iconSize.xl }} />
      </Box>
      <Box>
        <Typography sx={{ color: brand.graphite[500], fontSize: 18, fontWeight: 900, mb: 0.6 }}>
          Nenhum contrato encontrado
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 14 }}>
          Gere um novo contrato ou ajuste os filtros para ampliar a busca.
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={onCreateContract}
        sx={{
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          mt: 0.6,
          textTransform: 'none',
          fontWeight: 900,
        }}
      >
        Gerar contrato
      </Button>
    </Stack>
  )
}
