'use client'

import { IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import { useTranslations } from 'next-intl'

import type { SearchResultsToolbarProps, SortOption } from '../../types/search'
import {
  styles,
  getIconButtonStyles,
  getIconButtonStyles2,
} from '../../styles/search-results-toolbar.styles'

export function SearchResultsToolbar({
  filtersControl,
  resultCount,
  setSortOption,
  setViewMode,
  sortOption,
  viewMode,
}: SearchResultsToolbarProps) {
  const t = useTranslations('marketplace.searchResults.toolbar')

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={styles.stack}
    >
      <Typography sx={styles.typography}>{t('resultCount', { count: resultCount })}</Typography>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        {filtersControl}

        <TextField
          select
          size="small"
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value as SortOption)}
          sx={styles.textField}
        >
          <MenuItem value="relevancia">{t('sortRelevance')}</MenuItem>
          <MenuItem value="menor-preco">{t('sortLowerPrice')}</MenuItem>
          <MenuItem value="maior-preco">{t('sortHigherPrice')}</MenuItem>
        </TextField>

        <IconButton
          aria-label={t('gridView')}
          onClick={() => setViewMode('grid')}
          sx={getIconButtonStyles({ viewMode })}
        >
          <AppsRoundedIcon sx={styles.appsRoundedIcon} />
        </IconButton>
        <IconButton
          aria-label={t('listView')}
          onClick={() => setViewMode('list')}
          sx={getIconButtonStyles2({ viewMode })}
        >
          <FormatListBulletedRoundedIcon sx={styles.appsRoundedIcon} />
        </IconButton>
      </Stack>
    </Stack>
  )
}
