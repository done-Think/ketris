'use client'

import { type ComponentType, type RefObject, useEffect, useState } from 'react'
import { Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import CloseIcon from '@mui/icons-material/Close'
import Link from 'next/link'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

type ProfileModalProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement>
  userProfile: {
    name: string
    role: string
    company: string
    email: string
    avatar: string
  }
  actions: Array<{
    label: string
    icon: ComponentType<SvgIconProps>
    href: string
    tone?: 'danger'
  }>
  onClose: () => void
}

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
      aria-label="Perfil do usuário"
      onClick={onClose}
      sx={{
        position: 'fixed',
        top: 60,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1300,
        bgcolor: 'transparent',
      }}
    >
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'fixed',
          top: panelPosition.top,
          right: panelPosition.right,
          width: '100%',
          maxWidth: { xs: 'calc(100vw - 24px)', sm: 390 },
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.modal,
          p: 2.4,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-14px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              alt={userProfile.name}
              src={userProfile.avatar}
              sx={{ width: 48, height: 48 }}
            />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{userProfile.name}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
                {userProfile.role}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label="Fechar perfil" size="small" onClick={onClose}>
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
          <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800 }}>
            {userProfile.company}
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: 12, fontWeight: 700 }}>
            {userProfile.email}
          </Typography>
        </Box>

        <Stack spacing={1}>
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
                  textTransform: 'none',
                  fontWeight: 800,
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
