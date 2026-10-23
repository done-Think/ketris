'use client'

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import {
  Avatar,
  Box,
  ButtonBase,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'
import type { AppShellSidebarProps } from '@shared/types/app-shell'

import { appShellNavigationItems } from './app-shell-navigation-items'
import { SidebarCollapseButton } from './SidebarCollapseButton'

export const sidebarExpandedWidth = 272
export const sidebarCollapsedWidth = 72

export function AppShellSidebar({
  collapsed,
  showCollapseControl,
  isLoading,
  visibleItems,
  activeTargetPath,
  userName,
  userContext,
  userInitials,
  userImage,
  canEditProfile,
  isPersonalProfileRoute,
  isSigningOut,
  onNavItemClick,
  onEditProfile,
  onToggleCollapsed,
  onLogoutToMarketplace,
}: AppShellSidebarProps) {
  const t = useTranslations('common.appShell')
  const width = collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Stack
        component="aside"
        sx={{
          width,
          height: '100%',
          bgcolor: brand.graphite[600],
          color: surface.lightText,
          overflow: 'hidden',
          px: collapsed ? 1 : 2,
          py: 2.5,
          transition: 'width 180ms ease, padding 180ms ease',
          '@media (max-height: 760px)': { py: 1.5 },
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: '100%',
            height: 48,
            flexShrink: 0,
            mb: 1.5,
            position: 'relative',
            '@media (max-height: 760px)': { mb: 1 },
          }}
        >
          <AppLogo
            src={collapsed ? '/ketris-tab-icon.png' : ketrisLogoFooter}
            width={collapsed ? 40 : 120}
            sx={{ left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)' }}
          />
        </Stack>

        <Stack
          component="nav"
          aria-label={t('ariaLabel')}
          sx={{
            mx: collapsed ? 0 : -0.5,
            flex: 1,
            minHeight: 0,
            gap: 0.5,
            '@media (max-height: 760px)': { gap: 0.25 },
          }}
        >
          {isLoading
            ? appShellNavigationItems.map((item) => (
                <Skeleton
                  key={item.labelKey}
                  variant="rounded"
                  height={44}
                  sx={{
                    alignSelf: collapsed ? 'center' : 'stretch',
                    bgcolor: alpha.white[8],
                    borderRadius: `${radius.sm}px`,
                    width: collapsed ? 44 : '100%',
                    flex: '0 1 44px',
                    minHeight: 24,
                  }}
                />
              ))
            : visibleItems.map(({ labelKey, href, icon: Icon }) => {
                const targetPath = href.split('?')[0]
                const active = targetPath === activeTargetPath
                const label = t(labelKey)

                return (
                  <Tooltip
                    key={labelKey}
                    title={collapsed ? label : ''}
                    placement="right"
                    disableHoverListener={!collapsed}
                    disableFocusListener={!collapsed}
                    disableTouchListener={!collapsed}
                  >
                    <Box
                      component={Link}
                      href={href}
                      onClick={onNavItemClick}
                      aria-current={active ? 'page' : undefined}
                      aria-label={collapsed ? label : undefined}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 1.5,
                        flex: '0 1 44px',
                        minHeight: 24,
                        px: collapsed ? 0 : 1.5,
                        width: collapsed ? 44 : '100%',
                        alignSelf: collapsed ? 'center' : 'stretch',
                        borderLeft: '3px solid',
                        borderColor: active ? 'primary.main' : 'transparent',
                        borderRadius: `${radius.sm}px`,
                        bgcolor: active ? alpha.white[8] : 'transparent',
                        color: active ? surface.lightText : alpha.white[62],
                        textDecoration: 'none',
                        transition: 'background-color 160ms ease, color 160ms ease',
                        '&:hover': {
                          bgcolor: alpha.white[8],
                          color: surface.lightText,
                        },
                      }}
                    >
                      <Icon
                        sx={{
                          display: 'block',
                          flexShrink: 0,
                          fontSize: iconSize.md + 1,
                          width: iconSize.md + 1,
                          height: iconSize.md + 1,
                          color: active ? 'primary.main' : 'inherit',
                        }}
                      />
                      <Typography
                        sx={{
                          display: collapsed ? 'none' : 'flex',
                          alignItems: 'center',
                          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                          fontSize: 14,
                          fontWeight: active ? 600 : 500,
                          lineHeight: `${iconSize.md + 1}px`,
                          letterSpacing: 0,
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  </Tooltip>
                )
              })}
        </Stack>

        <Stack
          direction={collapsed ? 'column' : 'row'}
          spacing={1.3}
          alignItems="center"
          sx={{
            mt: 'auto',
            pt: 2,
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: alpha.white[8],
            '@media (max-height: 760px)': { pt: 1 },
          }}
        >
          <ButtonBase
            aria-label={t('editProfile')}
            aria-current={isPersonalProfileRoute ? 'page' : undefined}
            onClick={onEditProfile}
            disabled={!canEditProfile}
            sx={{
              display: 'flex',
              flexGrow: collapsed ? 0 : 1,
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.3,
              minWidth: 0,
              borderRadius: `${radius.sm}px`,
              p: 0.5,
              bgcolor: isPersonalProfileRoute ? alpha.white[8] : 'transparent',
              color: isPersonalProfileRoute ? surface.lightText : 'inherit',
              '&:hover': { bgcolor: alpha.white[8] },
            }}
          >
            <Avatar
              src={userImage}
              alt={userName}
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.main',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: collapsed ? 'none' : 'block', minWidth: 0, textAlign: 'left' }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
                {userName}
              </Typography>
              <Typography noWrap sx={{ color: alpha.white[56], fontSize: 10.5 }}>
                {userContext}
              </Typography>
            </Box>
          </ButtonBase>
          <Tooltip title={t('logoutToMarketplace')}>
            <IconButton
              aria-label={t('logoutToMarketplace')}
              disabled={isSigningOut}
              onClick={onLogoutToMarketplace}
              sx={{
                width: 32,
                height: 32,
                color: alpha.white[62],
                '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
              }}
            >
              <LogoutOutlinedIcon sx={{ fontSize: iconSize.sm }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      {showCollapseControl ? (
        <SidebarCollapseButton
          collapsed={collapsed}
          onToggle={onToggleCollapsed}
          expandLabel={t('expandNavigation')}
          collapseLabel={t('collapseNavigation')}
          collapseTooltip={t('collapseMenu')}
        />
      ) : null}
    </Box>
  )
}
