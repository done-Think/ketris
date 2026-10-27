import { Box, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTranslations } from 'next-intl'

import type { TextSearchMenuProps } from '../types/search'
import { styles, getMenuItemStyles, getTypographyStyles } from '../styles/text-search-menu.styles'

export function TextSearchMenu({
  filterKey,
  centered = false,
  selectedSearch,
  searchDraft,
  filterSearchOptions,
  getSearchOptionLabel,
  selectSearchValue,
  setSearchDraft,
}: TextSearchMenuProps) {
  const t = useTranslations('marketplace.home.search')
  const options = filterSearchOptions(filterKey)
  const draftValue = searchDraft[filterKey]

  const clearDraft = () => {
    setSearchDraft((current) => ({
      ...current,
      [filterKey]: '',
    }))
  }

  return (
    <Box>
      <Box sx={styles.box}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder={
            filterKey === 'location' ? t('locationPlaceholder') : t('propertyTypePlaceholder')
          }
          value={draftValue}
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
          slotProps={{
            input: {
              endAdornment: draftValue ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('clearSearch')}
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

      <Box sx={styles.box2}>
        {options.length ? (
          options.map((value) => (
            <MenuItem
              key={value}
              selected={selectedSearch[filterKey] === value}
              onClick={() => selectSearchValue(filterKey, value)}
              sx={getMenuItemStyles({ centered, selectedSearch, filterKey, value })}
            >
              {getSearchOptionLabel(filterKey, value)}
            </MenuItem>
          ))
        ) : (
          <Typography sx={getTypographyStyles({ centered })}>{t('noResults')}</Typography>
        )}
      </Box>
    </Box>
  )
}
