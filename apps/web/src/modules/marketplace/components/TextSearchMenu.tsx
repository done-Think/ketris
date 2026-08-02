import { type Dispatch, type SetStateAction } from 'react'
import { Box, MenuItem, TextField, Typography } from '@mui/material'

import { alpha, componentText, surface } from '@shared/theme/tokens'

import type { SearchFilterKey, TextSearchFilterKey } from '../config/search-filters'

type TextSearchMenuProps = {
  filterKey: TextSearchFilterKey
  centered?: boolean
  selectedSearch: Record<SearchFilterKey, string>
  searchDraft: Record<TextSearchFilterKey, string>
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  selectSearchValue: (key: SearchFilterKey, value: string) => void
  setSearchDraft: Dispatch<SetStateAction<Record<TextSearchFilterKey, string>>>
}

export function TextSearchMenu({
  filterKey,
  centered = false,
  selectedSearch,
  searchDraft,
  filterSearchOptions,
  selectSearchValue,
  setSearchDraft,
}: TextSearchMenuProps) {
  const options = filterSearchOptions(filterKey)

  return (
    <Box>
      <Box sx={{ p: 1 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder={
            filterKey === 'location' ? 'Digite cidade ou bairro' : 'Digite o tipo de imóvel'
          }
          value={searchDraft[filterKey]}
          onChange={(event) =>
            setSearchDraft((current) => ({
              ...current,
              [filterKey]: event.target.value,
            }))
          }
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            const [firstOption] = options
            if (firstOption) selectSearchValue(filterKey, firstOption)
          }}
        />
      </Box>

      <Box sx={{ maxHeight: { md: 82, xl: 132 }, overflowY: 'auto', pb: 0.5 }}>
        {options.length ? (
          options.map((value) => (
            <MenuItem
              key={value}
              selected={selectedSearch[filterKey] === value}
              onClick={() => selectSearchValue(filterKey, value)}
              sx={{
                color: 'text.primary',
                justifyContent: centered ? 'center' : 'flex-start',
                ...(centered ? componentText.menuItemCentered : componentText.menuItem),
                ...(selectedSearch[filterKey] === value ? componentText.menuItemSelected : {}),
                '&.Mui-selected': {
                  bgcolor: alpha.magenta[10],
                  color: surface.darkText,
                },
                '&.Mui-selected:hover': {
                  bgcolor: alpha.magenta[14],
                },
                '&:hover': {
                  bgcolor: alpha.graphite[6],
                },
              }}
            >
              {value}
            </MenuItem>
          ))
        ) : (
          <Typography
            sx={{
              color: 'text.secondary',
              px: 2,
              py: 1.5,
              ...(centered ? componentText.menuItemCentered : componentText.menuEmpty),
              textAlign: centered ? 'center' : 'left',
            }}
          >
            Nenhum resultado
          </Typography>
        )}
      </Box>
    </Box>
  )
}
