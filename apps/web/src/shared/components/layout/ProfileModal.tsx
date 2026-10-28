'use client'

import { styles } from '@shared/styles/profile-modal.styles'

import { useEffect, useState } from 'react'
import { Avatar, Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'
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
      sx={styles.box}
    >
      <Box onClick={(event) => event.stopPropagation()} sx={styles.box2(panelPosition, isVisible)}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={styles.stack}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={styles.stack2}>
            <Avatar alt={userProfile.name} src={userProfile.avatar} sx={styles.avatar}>
              {!userProfile.avatar ? getInitials(userProfile.name) : null}
            </Avatar>
            <Box sx={styles.box3}>
              <Typography noWrap sx={componentText.modalTitle}>
                {userProfile.name}
              </Typography>
              <Typography noWrap sx={styles.typography}>
                {userProfile.role ? t(`roles.${userProfile.role}`) : null}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label={t('closeProfile')} size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {userProfile.company || userProfile.email ? (
          <Box sx={styles.box4}>
            {userProfile.company ? (
              <Typography sx={styles.typography2}>{userProfile.company}</Typography>
            ) : null}
            <Typography sx={styles.typography3}>{userProfile.email}</Typography>
          </Box>
        ) : null}

        <Divider sx={styles.divider} />

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
                startIcon={<Icon />}
                fullWidth
                sx={styles.button(isDanger)}
              >
                <Typography component="span" sx={styles.typography4}>
                  {action.label}
                </Typography>
              </Button>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
