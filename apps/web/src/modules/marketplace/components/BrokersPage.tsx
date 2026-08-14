'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
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

import { HomeHeader, SiteFooter } from '@shared/components/layout'
import { iconSize, radius, surface } from '@shared/theme/tokens'

import { footerColumns, homeNavigationItems, legalLinks } from '../config/navigation'
import { brokers } from '../data/brokers'
import { normalizeSearchText } from '../utils/search'
import { BrokerCard } from './BrokerCard'

const initialBrokerCount = 4
const brokerPageSize = 3

export function BrokersPage() {
  const { getValues, register, setValue, watch } = useForm({
    defaultValues: {
      isLoadingMore: false,
      searchQuery: '',
      visibleCount: initialBrokerCount,
    },
  })
  const { isLoadingMore, searchQuery, visibleCount } = watch()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href === '/corretores',
  }))
  const filteredBrokers = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim())

    return brokers.filter((broker) => {
      const searchableText = normalizeSearchText(
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
    setValue('visibleCount', initialBrokerCount)
  }, [searchQuery, setValue])

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasMoreBrokers || isLoadingMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        setValue('isLoadingMore', true)
        window.setTimeout(() => {
          setValue(
            'visibleCount',
            Math.min(getValues('visibleCount') + brokerPageSize, filteredBrokers.length),
          )
          setValue('isLoadingMore', false)
        }, 420)
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(loadMoreElement)

    return () => observer.disconnect()
  }, [filteredBrokers.length, getValues, hasMoreBrokers, isLoadingMore, setValue, visibleCount])

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
      <HomeHeader navigationItems={navigationItems} />

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
              {...register('searchQuery')}
              value={searchQuery}
              placeholder="Nome, CRECI, bairro ou região"
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
