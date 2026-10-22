'use client'

import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import { IconButton, Tooltip } from '@mui/material'

import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'
import type { SidebarCollapseButtonProps } from '@shared/types/sidebar-collapse-button'

// Botão redondo posicionado na divisória entre a sidebar e a página. O container pai precisa ter
// `position: relative` e não pode cortar o overflow horizontal (o botão fica metade para fora).
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
        sx={{
          position: 'absolute',
          right: -14,
          top: 32,
          zIndex: 1,
          width: 28,
          height: 28,
          bgcolor: brand.graphite[600],
          border: '1px solid',
          borderColor: alpha.white[8],
          color: alpha.white[62],
          '&:hover': { bgcolor: brand.graphite[600], color: surface.lightText },
        }}
      >
        <KeyboardDoubleArrowLeftRoundedIcon
          sx={{
            fontSize: iconSize.sm,
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 180ms ease',
          }}
        />
      </IconButton>
    </Tooltip>
  )
}
