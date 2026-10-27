'use client'

import { IconButton, Stack, Tooltip } from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import { useTranslations } from 'next-intl'

import type { DirectoryViewModeToggleProps } from '../../types/directory'
import {
  styles,
  getIconButtonStyles,
  getIconButtonStyles2,
} from '../../styles/directory-view-mode-toggle.styles'

export function DirectoryViewModeToggle({ value, onChange }: DirectoryViewModeToggleProps) {
  const t = useTranslations('marketplace.directory.viewMode')

  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={t('grid')}>
        <IconButton
          aria-label={t('grid')}
          onClick={() => onChange('grid')}
          sx={getIconButtonStyles({ value })}
        >
          <AppsRoundedIcon sx={styles.appsRoundedIcon} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('list')}>
        <IconButton
          aria-label={t('list')}
          onClick={() => onChange('list')}
          sx={getIconButtonStyles2({ value })}
        >
          <FormatListBulletedRoundedIcon sx={styles.appsRoundedIcon} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
