'use client'

import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HomeHeader, ProfileModal } from '@shared/components/layout'
import { alpha, componentText, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { homeNavigationItems } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import { searchResults } from '../data/search-results'
import { SearchPropertyCard } from './SearchPropertyCard'
import { SearchResultsMap } from './SearchResultsMap'

const quickFilters = ['Tipo: Apartamento', 'Preço', 'Quartos', 'Área', 'Mais filtros'] as const

type SearchResultsPageProps = {
  purpose: 'alugar' | 'comprar'
}

export function SearchResultsPage({ purpose }: SearchResultsPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchResults[0]?.id ?? '')
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href.includes(`finalidade=${purpose}`),
  }))

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'clip',
        bgcolor: surface.app,
      }}
    >
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        actions={profileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.08fr) minmax(430px, 0.92fr)' },
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3, xl: 5 },
            py: { xs: 2, md: 3 },
            minWidth: 0,
          }}
        >
          <TextField
            fullWidth
            value="Jardins, São Paulo"
            size="small"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.primary', fontSize: iconSize.lg }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="Limpar busca" size="small">
                    <CloseRoundedIcon sx={{ fontSize: iconSize.sm }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                minHeight: 48,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                fontWeight: 700,
              },
            }}
          />

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            {quickFilters.map((filter, index) => (
              <Chip
                key={filter}
                label={filter}
                icon={index === 0 ? <CloseRoundedIcon /> : undefined}
                clickable
                sx={{
                  height: 34,
                  borderRadius: `${radius.sm}px`,
                  borderColor: index === 0 ? 'primary.main' : 'divider',
                  bgcolor: index === 0 ? 'primary.main' : surface.paper,
                  color: index === 0 ? surface.lightText : 'text.primary',
                  fontWeight: 700,
                  transition: motion.transition.bordered,
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    order: 2,
                    mr: 1,
                    ml: -0.4,
                    fontSize: iconSize.xs,
                  },
                  '&:hover': {
                    bgcolor: index === 0 ? 'primary.dark' : alpha.magenta[6],
                    borderColor: index === 0 ? 'primary.dark' : 'primary.main',
                  },
                }}
                variant={index === 0 ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 14 }}>
              47 imóveis encontrados
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <TextField
                select
                size="small"
                value="relevancia"
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
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: alpha.magenta[8],
                  color: 'primary.main',
                }}
              >
                <AppsRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
              <IconButton
                aria-label="Visualização em lista"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${radius.sm}px`,
                  color: 'text.secondary',
                }}
              >
                <FormatListBulletedRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: { xs: 2, xl: 2.5 },
            }}
          >
            {searchResults.map((property) => (
              <SearchPropertyCard
                key={property.id}
                property={property}
                selected={property.id === selectedPropertyId}
                onActivate={() => setSelectedPropertyId(property.id)}
              />
            ))}
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ mt: 2.4 }}
          >
            <IconButton
              aria-label="Filtros"
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                width: 38,
                height: 38,
                borderRadius: radius.full,
                bgcolor: surface.paper,
                boxShadow: `0 8px 20px ${alpha.graphite[8]}`,
              }}
            >
              <FilterListRoundedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
            {[1, 2, 3].map((page) => (
              <Button
                key={page}
                size="small"
                sx={{
                  minWidth: 34,
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  color: page === 1 ? surface.lightText : 'text.secondary',
                  bgcolor: page === 1 ? 'primary.main' : 'transparent',
                  ...componentText.resetButtonText,
                  '&:hover': {
                    bgcolor: page === 1 ? 'primary.dark' : alpha.magenta[6],
                  },
                }}
              >
                {page}
              </Button>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', lg: 'block' },
            alignSelf: 'start',
            position: { lg: 'sticky' },
            top: { lg: 68 },
            height: { lg: 'calc(100vh - 76px)' },
            minHeight: { lg: 620 },
            minWidth: 0,
            p: 1,
            pl: 0,
          }}
        >
          <SearchResultsMap
            properties={searchResults}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
          />
        </Box>
      </Box>
    </Box>
  )
}
