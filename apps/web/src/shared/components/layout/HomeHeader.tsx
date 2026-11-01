'use client'

import { styles } from '@shared/styles/home-header.styles'

import { useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link as MuiLink,
  Stack,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'

import type { HomeHeaderProps } from '@shared/types/home-header'
import { getInitials } from '@shared/utils/get-initials'
import { LanguageSelector } from './LanguageSelector'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'

export function HomeHeader({
  navigationItems,
  profileButtonRef,
  userProfile,
  onToggleProfile,
  isSessionLoading = false,
  showSignIn = false,
  showLanguageSelector = false,
}: HomeHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const t = useTranslations('marketplace.header')
  const { data: session, status } = useSession()
  const showNotifications = status === 'authenticated' && session?.scope === 'tenant'
  const announcePropertyHref = status === 'authenticated' ? '/dashboard/properties' : '/login'
  const canAnnounceProperty = session?.role !== 'RENTER'

  return (
    <Box component="header" sx={styles.box}>
      <Container maxWidth="xl">
        <Box sx={styles.box2}>
          <AppLogo
            src={ketrisLogoTransparent}
            variant="transparent"
            width={{ xs: 100, sm: 118 }}
            sx={styles.appLogo}
          />

          <Stack
            component="nav"
            direction="row"
            alignItems="center"
            spacing={{ xs: 2, md: 2.5, lg: 4 }}
            sx={styles.stack}
          >
            {navigationItems.map((item) => (
              <MuiLink
                key={item.label}
                component={Link}
                href={item.href}
                underline="none"
                sx={styles.muiLink(Boolean(item.active))}
              >
                {item.label}
              </MuiLink>
            ))}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.5, md: 1 }}
            sx={styles.stack2}
          >
            {canAnnounceProperty ? (
              <Button
                component={Link}
                href={announcePropertyHref}
                variant="outlined"
                color="secondary"
                size="small"
                sx={styles.button}
              >
                {t('announceProperty')}
              </Button>
            ) : null}
            {showNotifications ? (
              <DashboardNotificationsButton placement="navigationHeader" />
            ) : null}
            {userProfile && profileButtonRef && onToggleProfile ? (
              <Box
                component="button"
                type="button"
                aria-label={t('openProfile')}
                aria-haspopup="dialog"
                ref={profileButtonRef}
                onClick={onToggleProfile}
                sx={styles.box3}
              >
                <Avatar alt={userProfile.name} src={userProfile.avatar} sx={styles.avatar}>
                  {!userProfile.avatar ? getInitials(userProfile.name) : null}
                </Avatar>
              </Box>
            ) : isSessionLoading ? (
              <Box sx={styles.box4} />
            ) : !showLanguageSelector ? (
              <LanguageSelector variant="header" />
            ) : null}
            {!isSessionLoading && showLanguageSelector ? (
              <Box sx={styles.box5}>
                <LanguageSelector variant="header" />
              </Box>
            ) : null}
            {showSignIn ? (
              <Button
                component={Link}
                href="/login"
                aria-label={t('signIn')}
                endIcon={<LoginOutlinedIcon fontSize="small" />}
                variant="outlined"
                color="secondary"
                size="small"
                sx={styles.button2}
              >
                <Box component="span" sx={styles.box6}>
                  {t('signIn')}
                </Box>
              </Button>
            ) : null}
            <IconButton
              aria-label={t('openMenu')}
              aria-controls="home-mobile-menu"
              aria-expanded={isMobileMenuOpen ? 'true' : undefined}
              onClick={() => setIsMobileMenuOpen(true)}
              size="small"
              sx={styles.iconButton2}
            >
              <MenuRoundedIcon sx={styles.menuRoundedIcon} />
            </IconButton>
          </Stack>
        </Box>
      </Container>

      <Drawer
        anchor="right"
        id="home-mobile-menu"
        open={isMobileMenuOpen}
        onClose={closeMobileMenu}
        slotProps={{
          paper: {
            sx: styles.paper,
          },
        }}
      >
        <Stack sx={styles.stack3} spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <AppLogo
              src={ketrisLogoTransparent}
              variant="transparent"
              width={104}
              sx={styles.appLogo2}
            />
            <IconButton aria-label={t('closeMenu')} onClick={closeMobileMenu} size="small">
              <CloseRoundedIcon sx={styles.closeRoundedIcon} />
            </IconButton>
          </Stack>

          <Divider />

          <Stack component="nav" spacing={0.5} aria-label={t('mainMenu')}>
            {navigationItems.map((item) => (
              <MuiLink
                key={item.label}
                component={Link}
                href={item.href}
                underline="none"
                onClick={closeMobileMenu}
                sx={styles.muiLink2(Boolean(item.active))}
              >
                {item.label}
              </MuiLink>
            ))}
          </Stack>

          <Divider />

          <LanguageSelector />

          {canAnnounceProperty ? (
            <>
              <Divider />

              <Button
                component={Link}
                href={announcePropertyHref}
                variant="contained"
                color="primary"
                onClick={closeMobileMenu}
                fullWidth
                sx={styles.button3}
              >
                {t('announceProperty')}
              </Button>
            </>
          ) : null}
        </Stack>
      </Drawer>
    </Box>
  )
}
