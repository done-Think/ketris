import { type RefObject } from 'react'
import { Avatar, Box, Button, Container, IconButton, Link as MuiLink, Stack } from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import Link from 'next/link'

import { AppLogo } from '@shared/components/ui'
import {
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

type HomeHeaderProps = {
  navigationItems: ReadonlyArray<{
    label: string
    href: string
    active?: boolean
  }>
  profileButtonRef: RefObject<HTMLButtonElement>
  userProfile: {
    name: string
    avatar: string
  }
  onToggleProfile: () => void
}

export function HomeHeader({
  navigationItems,
  profileButtonRef,
  userProfile,
  onToggleProfile,
}: HomeHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: surface.paper,
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: zIndex.header,
        width: '100%',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            minHeight: 60,
            display: 'grid',
            gridTemplateColumns: { xs: 'auto 1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          <AppLogo
            src="/ketris-logo-transparent.png"
            width={{ xs: 100, sm: 118 }}
            sx={{ justifySelf: 'start' }}
          />

          <Stack
            component="nav"
            direction="row"
            alignItems="center"
            spacing={{ xs: 2, md: 4 }}
            sx={{ display: { xs: 'none', md: 'flex' }, justifySelf: 'center' }}
          >
            {navigationItems.map((item) => {
              return (
                <MuiLink
                  key={item.label}
                  component={Link}
                  href={item.href}
                  underline="none"
                  sx={{
                    color: item.active ? 'primary.main' : 'text.secondary',
                    ...componentText.navLink,
                    px: 1.45,
                    py: 0.85,
                    mt: 0.1,
                    borderRadius: `${radius.sm}px`,
                    position: 'relative',
                    transition: motion.transition.interactive,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -2,
                      height: 2,
                      bgcolor: item.active ? 'primary.main' : 'transparent',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: surface.darkText,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              )
            })}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ justifySelf: 'end' }}>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              color="secondary"
              size="small"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                borderRadius: `${radius.sm}px`,
                display: { xs: 'none', sm: 'inline-flex' },
                minHeight: 42,
                px: 2,
                ...componentText.headerCta,
                transition: motion.transition.bordered,
                '&:hover': {
                  bgcolor: 'transparent',
                  borderColor: surface.darkText,
                  color: surface.darkText,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Anunciar Imóvel
            </Button>
            <IconButton aria-label="notificações" size="small" sx={{ width: 42, height: 42 }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: iconSize.xl }} />
            </IconButton>
            <Box
              component="button"
              type="button"
              aria-label="Abrir perfil"
              aria-haspopup="dialog"
              ref={profileButtonRef}
              onClick={onToggleProfile}
              sx={{
                width: 48,
                height: 48,
                p: 0,
                border: 0,
                borderRadius: radius.full,
                bgcolor: 'transparent',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
                zIndex: zIndex.content - 1,
                transition: motion.transition.avatar,
                '&:hover': {
                  boxShadow: shadows.avatarFocus,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Avatar
                alt={userProfile.name}
                src={userProfile.avatar}
                sx={{ width: 48, height: 48 }}
              />
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
