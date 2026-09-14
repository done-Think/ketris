'use client'

import { useEffect, useState } from 'react'
import { Avatar, Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import {
  alpha,
  componentText,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'
import type { ProfileModalProps } from '@shared/types/profile-modal'
import { getInitials } from '@shared/utils/get-initials'
import { LanguageSelector } from './LanguageSelector'

export function ProfileModal({
  open,
  anchorRef,
  userProfile,
  actions,
  onClose,
}: ProfileModalProps) {
  const [isMounted, setIsMounted] = useState(open)
  const [isVisible, setIsVisible] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 68, right: 16 })
  const t = useTranslations('marketplace.profile')

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

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = anchorRef.current?.getBoundingClientRect()

      if (!anchor) return

      setPanelPosition({
        top: Math.round(anchor.bottom + 12),
        right: Math.max(12, Math.round(window.innerWidth - anchor.right - 16)),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef, open])

  if (!isMounted) return null

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={t('dialogLabel')}
      onClick={onClose}
      sx={{
        position: 'fixed',
        top: 60,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: zIndex.modal,
        bgcolor: 'transparent',
      }}
    >
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'fixed',
          top: { xs: 80, sm: panelPosition.top },
          right: { xs: 12, sm: panelPosition.right },
          left: { xs: 12, sm: 'auto' },
          width: { xs: 'auto', sm: '100%' },
          maxWidth: { sm: 390 },
          maxHeight: { xs: 'calc(100vh - 96px)', sm: 'calc(100vh - 88px)' },
          overflowY: 'auto',
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.modal,
          p: 2.4,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-14px)',
          transition: motion.transition.panel,
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              alt={userProfile.name}
              src={userProfile.avatar}
              sx={{ width: 48, height: 48, flexShrink: 0 }}
            >
              {!userProfile.avatar ? getInitials(userProfile.name) : null}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={componentText.modalTitle}>
                {userProfile.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', ...componentText.modalSubtitle }}>
                {t('role')}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label={t('closeProfile')} size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.app,
            px: 1.5,
            py: 1.2,
            mb: 2,
          }}
        >
          {userProfile.company ? (
            <Typography sx={{ color: 'text.secondary', ...componentText.modalEyebrow }}>
              {userProfile.company}
            </Typography>
          ) : null}
          <Typography sx={{ color: 'text.primary', ...componentText.modalSubtitle }}>
            {userProfile.email}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Stack spacing={1}>
          <LanguageSelector />

          {actions.map((action) => {
            const Icon = action.icon
            const isDanger = action.tone === 'danger'
            const linkProps = action.href
              ? { component: Link, href: action.href }
              : { component: 'button' as const, type: 'button' as const }
            return (
              <Button
                key={action.label}
                {...linkProps}
                onClick={() => {
                  action.onClick?.()
                  onClose()
                }}
                startIcon={<Icon fontSize="small" />}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  minHeight: 42,
                  borderRadius: `${radius.sm}px`,
                  color: isDanger ? 'error.main' : 'text.primary',
                  bgcolor: isDanger ? alpha.error[6] : 'transparent',
                  ...componentText.resetButtonText,
                  ...componentText.modalAction,
                  '&:hover': {
                    bgcolor: isDanger ? alpha.error[10] : alpha.magenta[8],
                    color: isDanger ? 'error.main' : 'primary.main',
                  },
                }}
              >
                {action.label}
              </Button>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
