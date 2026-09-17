'use client'

import { IconButton, Stack, Tooltip } from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import { useTranslations } from 'next-intl'

import { alpha, iconSize, radius, surface } from '@shared/theme/tokens'

import type { DirectoryViewModeToggleProps } from '../../types/directory'

export function DirectoryViewModeToggle({ value, onChange }: DirectoryViewModeToggleProps) {
  const t = useTranslations('marketplace.directory.viewMode')

  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={t('grid')}>
        <IconButton
          aria-label={t('grid')}
          onClick={() => onChange('grid')}
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${radius.sm}px`,
            bgcolor: value === 'grid' ? alpha.magenta[8] : surface.paper,
            color: value === 'grid' ? 'primary.main' : 'text.secondary',
            border: '1px solid',
            borderColor: value === 'grid' ? 'primary.main' : 'divider',
          }}
        >
          <AppsRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('list')}>
        <IconButton
          aria-label={t('list')}
          onClick={() => onChange('list')}
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${radius.sm}px`,
            bgcolor: value === 'list' ? alpha.magenta[8] : surface.paper,
            color: value === 'list' ? 'primary.main' : 'text.secondary',
            border: '1px solid',
            borderColor: value === 'list' ? 'primary.main' : 'divider',
          }}
        >
          <FormatListBulletedRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
