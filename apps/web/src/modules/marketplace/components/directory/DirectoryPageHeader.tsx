'use client'

import { Box, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import type { DirectoryPageHeaderProps } from '../../types/directory'
import { styles } from '../../styles/directory-page-header.styles'

export function DirectoryPageHeader({
  actions,
  placeholder,
  resultCountLabel,
  search,
  onSearchChange,
  title,
}: DirectoryPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'end' }}
      justifyContent="space-between"
      spacing={2}
      sx={styles.stack}
    >
      <Box sx={styles.box}>
        <Typography component="h1" sx={styles.typography}>
          {title}
        </Typography>
        <Typography sx={styles.typography2}>{resultCountLabel}</Typography>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent={{ xs: 'space-between', md: 'flex-end' }}
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          size="small"
          slotProps={{
            htmlInput: { maxLength: 80, 'aria-label': placeholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={styles.searchRoundedIcon} />
                </InputAdornment>
              ),
            },
          }}
          sx={styles.textField}
        />
        {actions}
      </Stack>
    </Stack>
  )
}
