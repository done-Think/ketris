'use client'

import { useMemo, useRef, useState } from 'react'
import { Box, Chip, Container, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { alpha, componentText, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { agencies } from '../data/agencies'
import { profileActions, userProfile } from '../data/user-profile'
import type { AgencyProfile, AgencySegment } from '../types/agency'
import { AgencyProfileModal } from './AgencyProfileModal'
import { AgencyRow } from './AgencyRow'

const segmentFilters: Array<AgencySegment | 'Todos'> = [
  'Todos',
  'Residencial',
  'Comercial',
  'Alto padrão',
  'Administração',
]

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function AgenciesPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<(typeof segmentFilters)[number]>('Todos')
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0]?.id ?? '')
  const [profileAgency, setProfileAgency] = useState<AgencyProfile | null>(null)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/imobiliarias',
  }))
  const filteredAgencies = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim())

    return agencies.filter((agency) => {
      const matchesSegment =
        selectedSegment === 'Todos' || agency.segments.includes(selectedSegment)
      const searchableText = normalizeText(
        `${agency.name} ${agency.legalCreci} ${agency.headquarters} ${agency.coverage.join(
          ' ',
        )} ${agency.segments.join(' ')}`,
      )

      return matchesSegment && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })
  }, [searchQuery, selectedSegment])
  const selectedAgency =
    filteredAgencies.find((agency) => agency.id === selectedAgencyId) ?? filteredAgencies[0] ?? null
  const coverageStats = useMemo(() => {
    const counts = new Map<string, number>()

    agencies.forEach((agency) => {
      agency.coverage.forEach((region) => {
        counts.set(region, (counts.get(region) ?? 0) + 1)
      })
    })

    return [...counts.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((current, next) => next.count - current.count)
      .slice(0, 6)
  }, [])

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

      <AgencyProfileModal
        open={Boolean(profileAgency)}
        agency={profileAgency}
        onClose={() => setProfileAgency(null)}
      />

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' },
              gap: { xs: 2.4, lg: 3 },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'stretch', md: 'end' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h1"
                    sx={{
                      color: surface.darkText,
                      fontSize: { xs: 24, md: 32 },
                      fontWeight: 900,
                      lineHeight: 1.15,
                      letterSpacing: 0,
                      mb: 0.7,
                    }}
                  >
                    Imobiliárias
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 700 }}>
                    {filteredAgencies.length} operações parceiras encontradas
                  </Typography>
                </Box>

                <TextField
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nome, CRECI, região ou segmento"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: 'text.primary', fontSize: iconSize.lg }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { xs: '100%', md: 390 },
                    '& .MuiOutlinedInput-root': {
                      minHeight: 48,
                      borderRadius: `${radius.sm}px`,
                      bgcolor: surface.paper,
                      fontSize: 13,
                      fontWeight: 700,
                    },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.2 }}>
                {segmentFilters.map((segment) => {
                  const active = segment === selectedSegment

                  return (
                    <Chip
                      key={segment}
                      label={segment}
                      clickable
                      onClick={() => setSelectedSegment(segment)}
                      sx={{
                        height: 34,
                        borderRadius: `${radius.sm}px`,
                        borderColor: active ? 'primary.main' : 'divider',
                        bgcolor: active ? 'primary.main' : surface.paper,
                        color: active ? surface.lightText : 'text.primary',
                        fontWeight: 800,
                        transition: motion.transition.bordered,
                        '&:hover': {
                          bgcolor: active ? 'primary.dark' : alpha.magenta[6],
                          borderColor: active ? 'primary.dark' : 'primary.main',
                        },
                      }}
                      variant={active ? 'filled' : 'outlined'}
                    />
                  )
                })}
              </Stack>

              <Box
                sx={{
                  display: { xs: 'none', md: 'grid' },
                  gridTemplateColumns:
                    'minmax(250px, 1.3fr) minmax(180px, 0.9fr) repeat(3, minmax(92px, 0.42fr)) auto',
                  gap: 1.8,
                  px: 1.7,
                  mb: 0.8,
                }}
              >
                {['Operação', 'Segmentos', 'Imóveis', 'Equipe', 'Nota', ''].map((label) => (
                  <Typography
                    key={label || 'actions'}
                    sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 900 }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              <Stack spacing={1.1}>
                {filteredAgencies.map((agency) => (
                  <AgencyRow
                    key={agency.id}
                    {...agency}
                    selected={agency.id === selectedAgency?.id}
                    onSelect={() => setSelectedAgencyId(agency.id)}
                    onOpenProfile={() => setProfileAgency(agency)}
                  />
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                display: { xs: 'none', lg: 'block' },
                position: 'sticky',
                top: 84,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                p: 2,
              }}
            >
              <Typography sx={{ ...componentText.cardTitle, mb: 1.2 }}>
                Cobertura do marketplace
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700, mb: 2 }}>
                Compare força regional, tamanho de equipe e velocidade de resposta antes de acionar
                uma operação.
              </Typography>

              <Stack spacing={1}>
                {coverageStats.map((item) => (
                  <Box
                    key={item.region}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: surface.app,
                      px: 1.4,
                      py: 1.1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{item.region}</Typography>
                      <Typography color="primary" sx={{ fontSize: 13, fontWeight: 900 }}>
                        {item.count}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {selectedAgency ? (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.magenta[6],
                    mt: 1.4,
                    p: 1.4,
                  }}
                >
                  <Typography sx={{ ...componentText.cardTitle, mb: 0.8 }}>
                    {selectedAgency.name}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                    {selectedAgency.activeListings} imóveis ativos · {selectedAgency.brokersCount}{' '}
                    corretores · resposta em {selectedAgency.responseTime}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Box>
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
