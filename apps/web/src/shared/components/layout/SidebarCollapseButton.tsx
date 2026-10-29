'use client'

import { styles } from '@shared/styles/sidebar-collapse-button.styles'

import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import { IconButton, Tooltip } from '@mui/material'

import type { SidebarCollapseButtonProps } from '@shared/types/sidebar-collapse-button'

export function SidebarCollapseButton({
  collapsed,
  onToggle,
  expandLabel,
  collapseLabel,
  collapseTooltip,
}: SidebarCollapseButtonProps) {
  return (
    <Tooltip title={collapsed ? expandLabel : collapseTooltip} placement="right">
      <IconButton
        aria-label={collapsed ? expandLabel : collapseLabel}
        onClick={onToggle}
        sx={styles.iconButton}
      >
        <KeyboardDoubleArrowLeftRoundedIcon
          sx={styles.keyboardDoubleArrowLeftRoundedIcon(collapsed)}
        />
      </IconButton>
    </Tooltip>
  )
}
