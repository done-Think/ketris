'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

import { alpha, componentText, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import type { AgencyRowProps } from '../types/agency'
import { AgencyBrandBanner } from './AgencyBrandBanner'

export function AgencyRow(agencyRowProps: AgencyRowProps) {
  const openProfile = () => {
    agencyRowProps.onSelect()
    agencyRowProps.onOpenProfile()
  }

  return (
    <Box
      component="article"
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openProfile()
        }
      }}
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: agencyRowProps.selected ? 'primary.main' : 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: agencyRowProps.selected ? alpha.magenta[6] : surface.paper,
        color: 'text.primary',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(250px, 1.3fr) minmax(180px, 0.9fr) repeat(3, minmax(92px, 0.42fr)) auto',
        },
        alignItems: 'center',
        gap: { xs: 1.4, md: 1.8 },
        p: { xs: 1.5, md: 1.7 },
        textAlign: 'left',
        appearance: 'none',
        transition: motion.transition.bordered,
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha.magenta[6],
          transform: 'translateY(-1px)',
        },
      }}
    >
      <AgencyBrandBanner agency={agencyRowProps} size="compact" />

      <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
        {agencyRowProps.segments.slice(0, 2).map((segment) => (
          <Chip
            key={segment}
            label={segment}
            size="small"
            sx={{
              height: 25,
              borderRadius: `${radius.sm}px`,
              bgcolor: alpha.magenta[6],
              color: 'primary.main',
              fontSize: 10.5,
              fontWeight: 800,
            }}
          />
        ))}
      </Stack>

      {[
        {
          icon: ApartmentOutlinedIcon,
          label: 'Imóveis',
          value: agencyRowProps.activeListings,
        },
        {
          icon: GroupsOutlinedIcon,
          label: 'Equipe',
          value: agencyRowProps.brokersCount,
        },
        {
          icon: StarRoundedIcon,
          label: 'Nota',
          value: agencyRowProps.rating,
        },
      ].map(({ icon: Icon, label, value }) => (
        <Stack key={label} direction="row" alignItems="center" spacing={0.6}>
          <Icon sx={{ color: 'text.secondary', fontSize: iconSize.sm }} />
          <Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{value}</Typography>
          </Box>
        </Stack>
      ))}

      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.55,
          justifySelf: { md: 'end' },
          color: 'primary.main',
          ...componentText.resetButtonText,
          fontWeight: 900,
        }}
      >
        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: iconSize.sm }} />
        Contato
      </Box>
    </Box>
  )
}
