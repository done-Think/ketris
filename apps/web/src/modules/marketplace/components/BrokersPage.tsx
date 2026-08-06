'use client'

import { useMemo, useRef, useState } from 'react'
import { Box, Chip, Container, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { alpha, componentText, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { brokers } from '../data/brokers'
import { profileActions, userProfile } from '../data/user-profile'
import type { BrokerSpecialty } from '../types/broker'
import { BrokerCard } from './BrokerCard'

const specialtyFilters: Array<BrokerSpecialty | 'Todos'> = [
  'Todos',
  'Aluguel',
  'Compra',
  'Alto padrão',
  'Comercial',
]

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function BrokersPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<(typeof specialtyFilters)[number]>('Todos')
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/corretores',
  }))
  const filteredBrokers = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim())

    return brokers.filter((broker) => {
      const matchesSpecialty =
        selectedSpecialty === 'Todos' || broker.specialties.includes(selectedSpecialty)
      const searchableText = normalizeText(
        `${broker.name} ${broker.creci} ${broker.region} ${broker.specialties.join(' ')}`,
      )

      return matchesSpecialty && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })
  }, [searchQuery, selectedSpecialty])

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

      <Box component="main" sx={{ py: { xs: 2.4, md: 4 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.78fr) minmax(320px, 0.22fr)' },
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
                    Corretores
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 700 }}>
                    {filteredBrokers.length} profissionais encontrados
                  </Typography>
                </Box>

                <TextField
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nome, CRECI, região ou especialidade"
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
                {specialtyFilters.map((specialty) => {
                  const active = specialty === selectedSpecialty

                  return (
                    <Chip
                      key={specialty}
                      label={specialty}
                      clickable
                      onClick={() => setSelectedSpecialty(specialty)}
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
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: { xs: 2, xl: 2.5 },
                }}
              >
                {filteredBrokers.map((broker) => (
                  <BrokerCard key={broker.id} {...broker} />
                ))}
              </Box>
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
                Especialistas Ketris
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700, mb: 2 }}>
                Profissionais com CRECI informado, regiões de atuação claras e histórico de
                atendimento visível.
              </Typography>
              <Stack spacing={1}>
                {[
                  ['339', 'negociações'],
                  ['238', 'imóveis ativos'],
                  ['16 min', 'tempo médio'],
                ].map(([value, label]) => (
                  <Box
                    key={label}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: surface.app,
                      px: 1.4,
                      py: 1.2,
                    }}
                  >
                    <Typography color="primary" sx={{ fontSize: 22, fontWeight: 900 }}>
                      {value}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
