import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Box, Button, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { ownerPropertiesSummary } from '../fixtures/owner-properties'
import type {
  OwnerPropertiesHeaderProps,
  OwnerPropertyPurposeFilter,
  OwnerPropertyStatusFilter,
} from '../types/owner-property'

const controlSx = {
  minWidth: 0,
  '& .MuiInputBase-root': {
    height: 42,
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    fontSize: 13,
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
  '& .MuiSelect-select': { pl: 2 },
}

export function OwnerPropertiesHeader({ filters, onFiltersChange }: OwnerPropertiesHeaderProps) {
  const summary = ownerPropertiesSummary

  return (
    <Box sx={{ mb: { xs: 1, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 20, md: 32 },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Meus Imóveis
        </Typography>
        <Button
          component={NextLink}
          href="/dashboard/imoveis/novo"
          variant="contained"
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            minHeight: 44,
            minWidth: 64,
            px: 1.5,
            borderRadius: `${radius.sm}px`,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          + Novo
        </Button>
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'minmax(220px, 1fr) auto auto auto' },
            gap: 2,
            width: { xs: '100%', md: 'auto' },
            flexGrow: { sm: 1, md: 0 },
          }}
        >
          <TextField
            placeholder="Buscar por endereço ou código..."
            value={filters.searchQuery}
            onChange={(event) => onFiltersChange({ ...filters, searchQuery: event.target.value })}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar por endereço ou código' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ fontSize: iconSize.sm, color: brand.neutral[500] }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              ...controlSx,
              gridColumn: { xs: '1 / -1', sm: 'auto' },
              width: { md: 250, lg: 340 },
            }}
          />
          <TextField
            select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as OwnerPropertyStatusFilter,
              })
            }
            slotProps={{
              select: {
                IconComponent: ExpandMoreRoundedIcon,
                SelectDisplayProps: { 'aria-label': 'Status' },
                renderValue: (value) =>
                  `Status: ${{ all: 'Todos', active: 'Ativo', paused: 'Pausado', 'without-proposals': 'Sem Proposta' }[value as OwnerPropertyStatusFilter]}`,
              },
            }}
            sx={controlSx}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Ativo</MenuItem>
            <MenuItem value="paused">Pausado</MenuItem>
            {filters.status === 'without-proposals' && (
              <MenuItem value="without-proposals">Sem Proposta</MenuItem>
            )}
          </TextField>
          <TextField
            select
            value={filters.purpose}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                purpose: event.target.value as OwnerPropertyPurposeFilter,
              })
            }
            slotProps={{
              select: {
                IconComponent: ExpandMoreRoundedIcon,
                SelectDisplayProps: { 'aria-label': 'Tipo' },
                renderValue: (value) =>
                  `Tipo: ${{ all: 'Todos', rent: 'Aluguel', sale: 'Venda' }[value as OwnerPropertyPurposeFilter]}`,
              },
            }}
            sx={controlSx}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="rent">Aluguel</MenuItem>
            <MenuItem value="sale">Venda</MenuItem>
          </TextField>
          <Button
            component={NextLink}
            href="/dashboard/imoveis/novo"
            variant="contained"
            sx={{
              minHeight: 44,
              px: 3,
              borderRadius: `${radius.sm}px`,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              gridColumn: { xs: '1 / -1', sm: 'auto' },
            }}
          >
            Novo Imóvel
          </Button>
        </Box>
      </Box>
      <Box
        role="group"
        aria-label="Filtrar imóveis"
        sx={{
          display: { xs: 'flex', md: 'none' },
          gap: 1,
          mt: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {(
          [
            ['all', 'Todos'],
            ['active', 'Ativos'],
            ['paused', 'Pausados'],
            ['without-proposals', 'Sem Proposta'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            aria-pressed={filters.status === value}
            onClick={() => onFiltersChange({ searchQuery: '', purpose: 'all', status: value })}
            sx={{
              flexShrink: 0,
              minHeight: 44,
              minWidth: 0,
              px: 0,
              fontSize: 11,
              color: filters.status === value ? surface.lightText : brand.neutral[600],
            }}
          >
            <Box
              component="span"
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: `${radius.full}px`,
                border: '1px solid',
                borderColor: filters.status === value ? 'primary.main' : 'divider',
                bgcolor: filters.status === value ? 'primary.main' : surface.paper,
              }}
            >
              {label}
            </Box>
          </Button>
        ))}
      </Box>
      <Typography
        sx={{
          display: { xs: 'none', md: 'block' },
          mt: 4,
          color: brand.neutral[500],
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.6,
        }}
      >
        {summary.totalProperties} IMÓVEIS · {summary.activeProperties} ATIVOS ·{' '}
        {summary.pausedProperties} PAUSADO · {summary.totalViews} VISUALIZAÇÕES TOTAIS ·{' '}
        {summary.openProposals} PROPOSTAS ABERTAS
      </Typography>
    </Box>
  )
}
