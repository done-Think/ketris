'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  CircularProgress,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HomeHeader, ProfileModal, SiteFooter } from '@shared/components/layout'
import { iconSize, radius, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { brokers } from '../data/brokers'
import { profileActions, userProfile } from '../data/user-profile'
import { BrokerCard } from './BrokerCard'

const initialBrokerCount = 4
const brokerPageSize = 3

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function BrokersPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(initialBrokerCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/corretores',
  }))
  const filteredBrokers = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim())

    return brokers.filter((broker) => {
      const searchableText = normalizeText(
        `${broker.name} ${broker.creci} ${broker.region} ${broker.neighborhoods.join(
          ' ',
        )} ${broker.specialties.join(' ')}`,
      )

      return !normalizedQuery || searchableText.includes(normalizedQuery)
    })
  }, [searchQuery])
  const visibleBrokers = useMemo(
    () => filteredBrokers.slice(0, visibleCount),
    [filteredBrokers, visibleCount],
  )
  const hasMoreBrokers = visibleCount < filteredBrokers.length

  useEffect(() => {
    setVisibleCount(initialBrokerCount)
  }, [searchQuery])

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasMoreBrokers || isLoadingMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        setIsLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount((current) => Math.min(current + brokerPageSize, filteredBrokers.length))
          setIsLoadingMore(false)
        }, 420)
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(loadMoreElement)

    return () => observer.disconnect()
  }, [filteredBrokers.length, hasMoreBrokers, isLoadingMore, visibleCount])

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
                Corretores
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 600 }}>
                {visibleBrokers.length} de {filteredBrokers.length} corretores encontrados
              </Typography>
            </Box>

            <TextField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nome, CRECI, bairro ou regiao"
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
                  minHeight: 44,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  fontSize: 13,
                  fontWeight: 600,
                },
              }}
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, xl: 2.5 },
            }}
          >
            {visibleBrokers.map((broker) => (
              <BrokerCard key={broker.id} {...broker} />
            ))}
          </Box>

          <Box
            ref={loadMoreRef}
            sx={{
              minHeight: 72,
              display: 'grid',
              placeItems: 'center',
              mt: 2,
            }}
          >
            {hasMoreBrokers ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} thickness={4} />
                <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 600 }}>
                  Carregando mais corretores
                </Typography>
              </Stack>
            ) : (
              <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 600 }}>
                {filteredBrokers.length
                  ? 'Todos os corretores foram carregados'
                  : 'Nenhum corretor encontrado'}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
