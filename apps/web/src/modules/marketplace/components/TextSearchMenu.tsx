import { Box, IconButton, InputAdornment, MenuItem, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useController } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { alpha, componentText, surface } from '@shared/theme/tokens'

import type { TextSearchMenuProps } from '../types/search'

export function TextSearchMenu({
  filterKey,
  centered = false,
  selectedSearch,
  searchDraftControl,
  filterSearchOptions,
  selectSearchValue,
}: TextSearchMenuProps) {
  const options = filterSearchOptions(filterKey)
  const { field } = useController({ control: searchDraftControl, name: filterKey })
  const draftValue = field.value

  const clearDraft = () => {
    field.onChange('')
  }

  return (
    <Box>
      <Box sx={{ p: 1 }}>
        <RhfTextField
          autoFocus
          fullWidth
          size="small"
          control={searchDraftControl}
          name={filterKey}
          placeholder={
            filterKey === 'location' ? 'Digite cidade ou bairro' : 'Digite o tipo de imóvel'
          }
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            const [firstOption] = options
            if (firstOption) selectSearchValue(filterKey, firstOption)
          }}
          slotProps={{
            input: {
              endAdornment: draftValue ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Limpar busca"
                    edge="end"
                    size="small"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearDraft}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
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
