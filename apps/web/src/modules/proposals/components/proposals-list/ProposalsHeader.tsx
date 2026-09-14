import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { ProposalListHeaderProps } from '../../types/proposal-management'

export function ProposalsHeader({
  search,
  onSearchChange,
  onNewProposal,
}: ProposalListHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      gap={2}
    >
      <Stack spacing={0.25}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 27, sm: 28 },
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          Propostas
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.45 }}>
          Gerencie propostas vinculadas a leads e imóveis
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={1.25}>
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar proposta..."
          inputProps={{ 'aria-label': 'Buscar propostas' }}
          size="small"
          sx={{
            width: { xs: '100%', sm: 240 },
            '& .MuiOutlinedInput-root': {
              height: 38,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              fontSize: 12.5,
              '& fieldset': { borderColor: brand.neutral[100] },
              '&:hover fieldset': { borderColor: brand.neutral[200] },
            },
            '& .MuiInputBase-input::placeholder': {
              color: brand.neutral[400],
              opacity: 1,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.md }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="button"
          variant="contained"
          startIcon={<AddRoundedIcon />}
          disabled={!onNewProposal}
          onClick={onNewProposal}
          sx={{
            minWidth: { sm: 136 },
            height: 38,
            px: 1.75,
            flexShrink: 0,
            borderRadius: `${radius.sm}px`,
            fontSize: 12.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
            '& .MuiSvgIcon-root': { fontSize: iconSize.lg },
            '&.Mui-disabled': {
              bgcolor: brand.magenta[500],
              color: surface.lightText,
              opacity: 1,
            },
          }}
        >
          Nova Proposta
        </Button>
      </Stack>
    </Stack>
  )
}
