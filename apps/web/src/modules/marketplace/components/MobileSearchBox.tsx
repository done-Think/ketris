import { Box, Button, Typography } from '@mui/material'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import Link from 'next/link'

import { componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { MobileSearchBoxProps } from '../types/search'
import { TextSearchMenu } from './TextSearchMenu'

export function MobileSearchBox({
  activeSearchMenu,
  mobileSearchRef,
  searchDraftControl,
  searchHref,
  selectedSearch,
  openSearchMenu,
  selectSearchValue,
  filterSearchOptions,
}: MobileSearchBoxProps) {
  return (
    <Box
      ref={mobileSearchRef}
      sx={{
        display: { xs: 'block', md: 'none' },
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        p: 1,
        maxWidth: 360,
        mx: 'auto',
        boxShadow: shadows.mobileSearch,
      }}
    >
      <Button
        fullWidth
        onClick={(event) => {
          event.stopPropagation()
          openSearchMenu('location')
        }}
        startIcon={<SearchOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          justifyContent: 'flex-start',
          minHeight: 36,
          px: 1.4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${radius.sm}px`,
          color: 'text.secondary',
          bgcolor: surface.paper,
          textAlign: 'left',
          ...componentText.resetButtonText,
          '&:hover': { bgcolor: surface.app },
          '& .MuiButton-startIcon': {
            color: 'primary.main',
          },
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
            ...componentText.mobileSearchText,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Buscar por bairro, cidade...
        </Typography>
      </Button>

      {activeSearchMenu === 'location' && (
        <Box
          sx={{
            mt: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            overflow: 'hidden',
          }}
        >
          <TextSearchMenu
            filterKey="location"
            centered
            selectedSearch={selectedSearch}
            searchDraftControl={searchDraftControl}
            filterSearchOptions={filterSearchOptions}
            selectSearchValue={selectSearchValue}
          />
        </Box>
      )}

      <Button
        component={Link}
        href={searchHref}
        variant="contained"
        fullWidth
        sx={{
          mt: 0.9,
          minHeight: 36,
          borderRadius: `${radius.sm}px`,
          ...componentText.mobileSearchSubmit,
        }}
      >
        Buscar
      </Button>
    </Box>
  )
}
