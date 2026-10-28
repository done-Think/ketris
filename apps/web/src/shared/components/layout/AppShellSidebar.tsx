'use client'

import { styles } from '@shared/styles/app-shell-sidebar.styles'

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

import type { AppShellSidebarProps } from '@shared/types/app-shell'

import { appShellNavigationItems } from './app-shell-navigation-items'
import { SidebarCollapseButton } from './SidebarCollapseButton'

import { sidebarCollapsedWidth, sidebarExpandedWidth } from '@shared/config/app-shell-layout'

export { sidebarCollapsedWidth, sidebarExpandedWidth } from '@shared/config/app-shell-layout'

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
    <Box sx={styles.box}>
      <Stack component="aside" sx={styles.stack(width, collapsed)}>
        <Stack alignItems="center" justifyContent="center" sx={styles.stack2}>
          <AppLogo
            src={collapsed ? '/ketris-tab-icon.png' : ketrisLogoFooter}
            width={collapsed ? 40 : 120}
            sx={styles.appLogo}
          />
        </Stack>

        <Stack component="nav" aria-label={t('ariaLabel')} sx={styles.stack3(collapsed)}>
          {isLoading
            ? appShellNavigationItems.map((item) => (
                <Skeleton
                  key={item.labelKey}
                  variant="rounded"
                  height={44}
                  sx={styles.skeleton(collapsed)}
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
                      sx={styles.box2(collapsed, active)}
                    >
                      <Icon sx={styles.icon(active)} />
                      <Typography sx={styles.typography(collapsed, active)}>{label}</Typography>
                    </Box>
                  </Tooltip>
                )
              })}
        </Stack>

        <Stack
          direction={collapsed ? 'column' : 'row'}
          spacing={1.3}
          alignItems="center"
          sx={styles.stack4}
        >
          <ButtonBase
            aria-label={t('editProfile')}
            aria-current={isPersonalProfileRoute ? 'page' : undefined}
            onClick={onEditProfile}
            disabled={!canEditProfile}
            sx={styles.buttonBase(collapsed, isPersonalProfileRoute)}
          >
            <Avatar src={userImage} alt={userName} sx={styles.avatar}>
              {userInitials}
            </Avatar>
            <Box sx={styles.box3(collapsed)}>
              <Typography noWrap sx={styles.typography2}>
                {userName}
              </Typography>
              <Typography noWrap sx={styles.typography3}>
                {userContext}
              </Typography>
            </Box>
          </ButtonBase>
          <Tooltip title={t('logoutToMarketplace')}>
            <IconButton
              aria-label={t('logoutToMarketplace')}
              disabled={isSigningOut}
              onClick={onLogoutToMarketplace}
              sx={styles.iconButton}
            >
              <LogoutOutlinedIcon sx={styles.logoutOutlinedIcon} />
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
