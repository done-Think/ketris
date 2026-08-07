'use client'

import { useEffect, useState } from 'react'
import { Box, Button, Chip, Divider, IconButton, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import CloseIcon from '@mui/icons-material/Close'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import Link from 'next/link'

import {
  alpha,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

import type { AgencyProfileModalProps } from '../types/agency'
import { AgencyBrandBanner } from './AgencyBrandBanner'

export function AgencyProfileModal({ open, agency, onClose }: AgencyProfileModalProps) {
  const [isMounted, setIsMounted] = useState(open)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setIsMounted(true)
      setIsVisible(false)
      const timeout = window.setTimeout(() => setIsVisible(true), 20)

      return () => window.clearTimeout(timeout)
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setIsMounted(false), 180)

    return () => window.clearTimeout(timeout)
  }, [open])

  if (!isMounted || !agency) return null

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`Operação de ${agency.name}`}
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: zIndex.modal,
        bgcolor: alpha.graphite[18],
        display: 'grid',
        placeItems: 'center',
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: 740,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.modal,
          p: { xs: 2, md: 2.6 },
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(14px)',
          transition: motion.transition.panel,
        }}
      >
        <Box sx={{ position: 'relative', mb: 2 }}>
          <IconButton
            aria-label="Fechar imobiliária"
            size="small"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              bgcolor: alpha.white[78],
              '&:hover': { bgcolor: surface.lightText },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <AgencyBrandBanner agency={agency} size="hero" />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {[
            { label: 'Imóveis', value: agency.activeListings },
            { label: 'Corretores', value: agency.brokersCount },
            { label: 'Mercado', value: `${agency.yearsInMarket} anos` },
            { label: 'Resposta', value: agency.responseTime },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.app,
                px: 1.3,
                py: 1.2,
              }}
            >
              <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
                {item.label}
              </Typography>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 900, mt: 0.3 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.app,
            px: 1.6,
            py: 1.4,
            mt: 1.2,
          }}
        >
          <Typography sx={{ color: 'text.secondary', ...componentText.modalEyebrow, mb: 0.8 }}>
            Resumo da operação
          </Typography>
          <Typography
            sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700, lineHeight: 1.6 }}
          >
            {agency.summary}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
            gap: 1.2,
            mt: 1.2,
          }}
        >
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              p: 1.5,
            }}
          >
            <Typography sx={{ ...componentText.cardTitle, mb: 1.2 }}>Contato comercial</Typography>
            <Stack spacing={1}>
              {[
                { icon: PhoneOutlinedIcon, label: agency.phone },
                { icon: EmailOutlinedIcon, label: agency.email },
                { icon: PlaceOutlinedIcon, label: agency.address },
              ].map(({ icon: Icon, label }) => (
                <Stack key={label} direction="row" alignItems="center" spacing={0.8}>
                  <Icon sx={{ color: 'primary.main', fontSize: iconSize.md }} />
                  <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              p: 1.5,
            }}
          >
            <Typography sx={{ ...componentText.cardTitle, mb: 1.2 }}>Cobertura e equipe</Typography>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              {agency.coverage.map((region) => (
                <Chip
                  key={region}
                  icon={<PlaceOutlinedIcon />}
                  label={region}
                  size="small"
                  sx={{
                    height: 28,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.app,
                    fontSize: 11,
                    fontWeight: 800,
                    '& .MuiChip-icon': { color: 'text.secondary', fontSize: iconSize.xs },
                  }}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.1 }}>
              {agency.teamHighlights.map((member) => (
                <Chip
                  key={member}
                  icon={<GroupsOutlinedIcon />}
                  label={member}
                  size="small"
                  sx={{
                    height: 28,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.magenta[6],
                    color: 'primary.main',
                    fontSize: 11,
                    fontWeight: 800,
                    '& .MuiChip-icon': { color: 'primary.main', fontSize: iconSize.xs },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: 1.4 }}>
          <Typography sx={{ ...componentText.cardTitle, mb: 1.1 }}>Imóveis em destaque</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {agency.featuredListings.map((listing) => (
              <Box
                key={`${agency.id}-${listing.title}`}
                component={Link}
                href={listing.href}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${radius.sm}px`,
                  color: 'inherit',
                  textDecoration: 'none',
                  p: 1.2,
                  transition: motion.transition.bordered,
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha.magenta[6] },
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 900, lineHeight: 1.3 }}>
                  {listing.title}
                </Typography>
                <Typography
                  sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800, mt: 0.5 }}
                >
                  {listing.location}
                </Typography>
                <Typography color="primary" sx={{ fontSize: 14, fontWeight: 900, mt: 0.8 }}>
                  {listing.price}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.4}>
          <Stack direction="row" alignItems="center" spacing={0.7} sx={{ minWidth: 0 }}>
            <ApartmentOutlinedIcon sx={{ color: 'text.secondary', fontSize: iconSize.md }} />
            <Typography noWrap sx={{ color: 'text.secondary', ...componentText.cardMeta }}>
              {agency.dealsClosed} negociações fechadas
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="small"
            sx={{
              borderRadius: `${radius.sm}px`,
              ...componentText.resetButtonText,
              fontWeight: 900,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Contatar
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
