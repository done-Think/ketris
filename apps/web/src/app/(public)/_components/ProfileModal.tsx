'use client'

import { type RefObject, useEffect, useState } from 'react'
import { Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Link from 'next/link'

import { profileActions, userProfile } from './_homeData'

type ProfileModalProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement>
  onClose: () => void
}

export function ProfileModal({ open, anchorRef, onClose }: ProfileModalProps) {
  const [isMounted, setIsMounted] = useState(open)
  const [isVisible, setIsVisible] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 68, right: 16 })

  useEffect(() => {
    if (open) {
      setIsMounted(true)
      setIsVisible(false)
      const firstFrame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsVisible(true))
      })

      return () => window.cancelAnimationFrame(firstFrame)
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
        zIndex: 20,
        bgcolor: 'transparent',
        pointerEvents: isVisible ? 'auto' : 'none',
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
          borderRadius: '8px',
          bgcolor: '#FFFFFF',
          boxShadow: '0 24px 70px rgba(13,15,20,0.32)',
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
            borderRadius: '8px',
            bgcolor: '#F7F8FA',
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
          {profileActions.map((action) => {
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
                  borderRadius: '8px',
                  color: isDanger ? 'error.main' : 'text.primary',
                  bgcolor: isDanger ? 'rgba(229, 72, 77, 0.06)' : 'transparent',
                  textTransform: 'none',
                  fontWeight: 800,
                  '&:hover': {
                    bgcolor: isDanger ? 'rgba(229, 72, 77, 0.1)' : 'rgba(243, 2, 116, 0.08)',
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
