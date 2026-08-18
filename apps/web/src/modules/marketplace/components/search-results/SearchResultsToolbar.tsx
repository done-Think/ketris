'use client'

import { IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'

import { alpha, iconSize, radius, surface } from '@shared/theme/tokens'

import type { SortOption, ViewMode } from '../../types/search'

type SearchResultsToolbarProps = {
  resultCount: number
  setSortOption: (option: SortOption) => void
  setViewMode: (mode: ViewMode) => void
  sortOption: SortOption
  viewMode: ViewMode
}

export function SearchResultsToolbar({
  resultCount,
  setSortOption,
  setViewMode,
  sortOption,
  viewMode,
}: SearchResultsToolbarProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 2 }}
    >
      <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 14 }}>
        {resultCount} imóveis encontrados
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          select
          size="small"
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value as SortOption)}
          sx={{
            minWidth: 190,
            '& .MuiOutlinedInput-root': {
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              fontSize: 12,
              fontWeight: 700,
            },
          }}
        >
          <MenuItem value="relevancia">Ordenar por: Relevância</MenuItem>
          <MenuItem value="menor-preco">Menor preço</MenuItem>
          <MenuItem value="maior-preco">Maior preço</MenuItem>
        </TextField>

        <IconButton
          aria-label="Visualização em grade"
          onClick={() => setViewMode('grid')}
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${radius.sm}px`,
            bgcolor: viewMode === 'grid' ? alpha.magenta[8] : 'transparent',
            color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
          }}
        >
          <AppsRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
        <IconButton
          aria-label="Visualização em lista"
          onClick={() => setViewMode('list')}
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${radius.sm}px`,
            bgcolor: viewMode === 'list' ? alpha.magenta[8] : 'transparent',
            color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
          }}
        >
          <FormatListBulletedRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
      </Stack>
    </Stack>
  )
}
