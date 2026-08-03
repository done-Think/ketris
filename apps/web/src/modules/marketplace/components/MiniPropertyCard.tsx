import { Box, Typography } from '@mui/material'
import Link from 'next/link'

import { componentText, gradients, motion, radius, surface } from '@shared/theme/tokens'

import type { MiniMarketplaceProperty } from '../types'

type MiniPropertyCardProps = {
  property: MiniMarketplaceProperty
}

export function MiniPropertyCard({ property }: MiniPropertyCardProps) {
  return (
    <Box
      component={Link}
      href="/imoveis"
      sx={{
        overflow: 'hidden',
        borderRadius: `${radius.sm}px`,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: surface.app,
        color: 'inherit',
        textDecoration: 'none',
        transition: motion.transition.tile,
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          height: { xs: 64, sm: 74 },
          backgroundImage: gradients.miniPropertyImage(property.image),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box sx={{ px: 1.2, py: 1 }}>
        <Typography
          sx={{
            color: 'text.primary',
            ...componentText.miniCardTitle,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {property.title}
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
            ...componentText.miniCardMeta,
            mt: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {property.location}
        </Typography>
      </Box>
    </Box>
  )
}
