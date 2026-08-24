'use client'

import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import Link from 'next/link'

import { publicMarketplaceText } from '@shared/i18n/pt-br'
import type { ProfileLanguageCode, ProfileModalProps } from '@shared/types'
import {
  alpha,
  componentText,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

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
  const [selectedLanguage, setSelectedLanguage] = useState<ProfileLanguageCode>('pt-BR')
  const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(null)
  const profileText = publicMarketplaceText.profile
  const languageOptions = [
    {
      code: 'pt-BR',
      label: profileText.languages.ptBR,
      shortLabel: 'BR',
      flagSrc: 'https://flagcdn.com/w40/br.png',
    },
    {
      code: 'en',
      label: profileText.languages.en,
      shortLabel: 'US',
      flagSrc: 'https://flagcdn.com/w40/us.png',
    },
    {
      code: 'es',
      label: profileText.languages.es,
      shortLabel: 'ES',
      flagSrc: 'https://flagcdn.com/w40/es.png',
    },
  ] as const
  const selectedLanguageOption =
    languageOptions.find((language) => language.code === selectedLanguage) ?? languageOptions[0]

  useEffect(() => {
    if (open) {
      setIsMounted(true)
      setIsVisible(false)
      const timeout = window.setTimeout(() => setIsVisible(true), 20)

      return () => window.clearTimeout(timeout)
    }

    setIsVisible(false)
    setLanguageAnchor(null)
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
      aria-label={profileText.dialogLabel}
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
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={componentText.modalTitle}>
                {userProfile.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', ...componentText.modalSubtitle }}>
                {userProfile.role}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label={profileText.closeProfile} size="small" onClick={onClose}>
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
          <Typography sx={{ color: 'text.secondary', ...componentText.modalEyebrow }}>
            {userProfile.company}
          </Typography>
          <Typography sx={{ color: 'text.primary', ...componentText.modalSubtitle }}>
            {userProfile.email}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Stack spacing={1}>
          <Button
            type="button"
            onClick={(event) => setLanguageAnchor(event.currentTarget)}
            startIcon={<TranslateOutlinedIcon fontSize="small" />}
            endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              minHeight: 42,
              borderRadius: `${radius.sm}px`,
              color: 'text.primary',
              ...componentText.resetButtonText,
              ...componentText.modalAction,
              '& .MuiButton-endIcon': {
                ml: 'auto',
              },
              '&:hover': {
                bgcolor: alpha.magenta[8],
                color: 'primary.main',
              },
            }}
          >
            <Stack
              component="span"
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ width: '100%', minWidth: 0 }}
            >
              <Box component="span">{profileText.language}</Box>
              <Stack component="span" direction="row" alignItems="center" spacing={0.75}>
                <Box
                  component="img"
                  src={selectedLanguageOption.flagSrc}
                  alt=""
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: radius.full,
                    objectFit: 'cover',
                    boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
                  }}
                />
                <Box component="span">{selectedLanguageOption.shortLabel}</Box>
              </Stack>
            </Stack>
          </Button>

          {actions.map((action) => {
            const Icon = action.icon
            const isDanger = action.tone === 'danger'
            return (
              <Button
                key={action.label}
                component={Link}
                href={action.href}
                onClick={onClose}
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

        <Menu
          anchorEl={languageAnchor}
          open={Boolean(languageAnchor)}
          onClose={() => setLanguageAnchor(null)}
          disableScrollLock
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{ 'aria-label': profileText.language }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.popover,
                minWidth: 176,
              },
            },
          }}
        >
          {languageOptions.map((language) => (
            <MenuItem
              key={language.code}
              selected={selectedLanguage === language.code}
              onClick={() => {
                setSelectedLanguage(language.code)
                setLanguageAnchor(null)
              }}
              sx={{ minHeight: 40, gap: 1.2 }}
            >
              <Box
                component="img"
                src={language.flagSrc}
                alt=""
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: radius.full,
                  objectFit: 'cover',
                  boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
                }}
              />
              <Typography sx={componentText.modalSubtitle}>{language.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  )
}
