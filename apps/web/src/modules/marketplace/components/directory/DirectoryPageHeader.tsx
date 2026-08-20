'use client'

import { Box, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { iconSize, radius, surface } from '@shared/theme/tokens'

import type { DirectoryPageHeaderProps } from '../../types/directory'

export function DirectoryPageHeader({
  actions,
  placeholder,
  resultCountLabel,
  searchInputProps,
  title,
}: DirectoryPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'end' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2.4 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{
            color: surface.darkText,
            fontSize: { xs: 24, md: 32 },
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: 0,
            mb: 0.7,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 500 }}>
          {resultCountLabel}
        </Typography>
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
          {...searchInputProps}
          placeholder={placeholder}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.primary', fontSize: iconSize.lg }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: '100%', md: 390 },
            '& .MuiOutlinedInput-root': {
              minHeight: 44,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              fontSize: 13,
              fontWeight: 500,
            },
          }}
        />
        {actions}
      </Stack>
    </Stack>
  )
}
