'use client'

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Box, Collapse, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useId, useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { styles } from '@shared/styles/app-shell-sidebar.styles'
import type { AppShellNavChild, AppShellNavigationGroupProps } from '@shared/types/app-shell'

export function isAppShellNavChildActive(
  child: AppShellNavChild,
  siblings: readonly AppShellNavChild[],
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'> | null,
) {
  const exactPath = pathname === child.href
  const matchesPath = exactPath || pathname.startsWith(`${child.href}/`)
  if (!matchesPath) return false
  if (child.query)
    return (
      exactPath &&
      Object.entries(child.query).every(([key, value]) => searchParams?.get(key) === value)
    )
  return !siblings.some(
    (sibling) =>
      sibling.href === child.href &&
      sibling.query &&
      exactPath &&
      Object.entries(sibling.query).every(([key, value]) => searchParams?.get(key) === value),
  )
}

function NavigationGroup({
  item,
  collapsed,
  active,
  onNavigate,
  searchParams,
}: AppShellNavigationGroupProps & { searchParams: Pick<URLSearchParams, 'get'> | null }) {
  const t = useTranslations('common.appShell')
  const pathname = usePathname()
  const childrenId = useId()
  const [expansion, setExpansion] = useState<{ pathname: string; expanded: boolean } | null>(null)
  const expanded = expansion?.pathname === pathname ? expansion.expanded : active
  const label = t(item.labelKey)
  const Icon = item.icon
  const children = item.children ?? []

  return (
    <Box sx={styles.navigationGroup}>
      <Box sx={styles.navigationGroupRow}>
        <Tooltip
          title={collapsed ? label : ''}
          placement="right"
          disableHoverListener={!collapsed}
          disableFocusListener={!collapsed}
          disableTouchListener={!collapsed}
        >
          <Box
            component={Link}
            href={item.href}
            onClick={onNavigate}
            aria-label={collapsed ? label : undefined}
            aria-current={active && pathname === item.href ? 'page' : undefined}
            sx={[styles.box2(collapsed, active), styles.navigationGroupParent(collapsed)]}
          >
            <Icon sx={styles.icon(active)} />
            <Typography sx={styles.typography(collapsed, active)}>{label}</Typography>
          </Box>
        </Tooltip>
        <IconButton
          aria-label={t(expanded ? 'collapseNavigationSection' : 'expandNavigationSection', {
            section: label,
          })}
          aria-expanded={expanded}
          aria-controls={childrenId}
          onClick={() => setExpansion({ pathname, expanded: !expanded })}
          sx={styles.navigationGroupToggle(collapsed)}
        >
          <ExpandMoreRoundedIcon sx={styles.navigationGroupChevron(expanded)} />
        </IconButton>
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <Stack
          id={childrenId}
          role="group"
          aria-label={label}
          sx={styles.navigationChildren(collapsed)}
        >
          {children.map((child) => {
            const childActive =
              active && isAppShellNavChildActive(child, children, pathname, searchParams)
            const ChildIcon = child.icon
            const childLabel = t(child.labelKey)
            return (
              <Tooltip
                key={child.labelKey}
                title={collapsed ? childLabel : ''}
                placement="right"
                disableHoverListener={!collapsed}
                disableFocusListener={!collapsed}
                disableTouchListener={!collapsed}
              >
                <Box
                  component={Link}
                  href={
                    child.query ? { pathname: child.href, query: { ...child.query } } : child.href
                  }
                  onClick={onNavigate}
                  aria-current={childActive ? 'page' : undefined}
                  aria-label={collapsed ? childLabel : undefined}
                  sx={[styles.box2(collapsed, childActive), styles.navigationChild(collapsed)]}
                >
                  <ChildIcon sx={styles.icon(childActive)} />
                  <Typography
                    sx={[styles.typography(collapsed, childActive), styles.navigationChildLabel]}
                  >
                    {childLabel}
                  </Typography>
                </Box>
              </Tooltip>
            )
          })}
        </Stack>
      </Collapse>
    </Box>
  )
}

function NavigationGroupWithParams(props: AppShellNavigationGroupProps) {
  const searchParams = useSearchParams()
  return <NavigationGroup {...props} searchParams={searchParams} />
}

export function AppShellNavigationGroup(props: AppShellNavigationGroupProps) {
  return (
    <Suspense fallback={<NavigationGroup {...props} searchParams={null} />}>
      <NavigationGroupWithParams {...props} />
    </Suspense>
  )
}
