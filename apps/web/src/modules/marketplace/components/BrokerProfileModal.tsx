'use client'

import { useEffect, useState } from 'react'
import { Avatar, Box, Button, Chip, Divider, IconButton, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CloseIcon from '@mui/icons-material/Close'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
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

import type { BrokerProfileModalProps } from '../types/broker'

export function BrokerProfileModal({ open, broker, onClose }: BrokerProfileModalProps) {
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

  if (!isMounted || !broker) return null

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${broker.name}`}
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
          maxWidth: 680,
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
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              alt={broker.name}
              src={broker.avatar}
              sx={{ width: 62, height: 62, boxShadow: `0 0 0 3px ${alpha.magenta[8]}` }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={componentText.modalTitle}>{broker.name}</Typography>
              <Typography sx={{ color: 'text.secondary', ...componentText.modalSubtitle }}>
                {broker.creci}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.35} sx={{ mt: 0.7 }}>
                <StarRoundedIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
                <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{broker.rating}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
                  avaliação média
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <IconButton aria-label="Fechar perfil do corretor" size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
            mt: 2.2,
          }}
        >
          {[
            { label: 'Região', value: broker.region },
            { label: 'Imóveis ativos', value: broker.activeListings },
            { label: 'Tempo de resposta', value: broker.responseTime },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                minWidth: 0,
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
            Resumo profissional
          </Typography>
          <Typography
            sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700, lineHeight: 1.6 }}
          >
            {broker.bio}
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
            <Typography sx={{ ...componentText.cardTitle, mb: 1.2 }}>Contato</Typography>
            <Stack spacing={1}>
              {[
                { icon: WhatsAppIcon, label: broker.phone },
                { icon: EmailOutlinedIcon, label: broker.email },
                { icon: ScheduleOutlinedIcon, label: broker.availability },
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
            <Typography sx={{ ...componentText.cardTitle, mb: 1.2 }}>Atuação</Typography>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              {broker.specialties.map((specialty) => (
                <Chip
                  key={specialty}
                  label={specialty}
                  size="small"
                  sx={{
                    height: 28,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.magenta[6],
                    color: 'primary.main',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.1 }}>
              {broker.neighborhoods.map((neighborhood) => (
                <Chip
                  key={neighborhood}
                  icon={<PlaceOutlinedIcon />}
                  label={neighborhood}
                  size="small"
                  sx={{
                    height: 28,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.app,
                    fontSize: 11,
                    fontWeight: 800,
                    '& .MuiChip-icon': {
                      color: 'text.secondary',
                      fontSize: iconSize.xs,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: 1.4 }}>
          <Typography sx={{ ...componentText.cardTitle, mb: 1.1 }}>
            Imóveis com este corretor
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {broker.highlightedListings.map((listing) => (
              <Box
                key={`${broker.id}-${listing.title}`}
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
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha.magenta[6],
                  },
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
              {broker.dealsClosed} negociações fechadas
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="small"
            startIcon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: iconSize.sm }} />}
            sx={{
              borderRadius: `${radius.sm}px`,
              ...componentText.resetButtonText,
              fontWeight: 900,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            }}
          >
            Contatar
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
