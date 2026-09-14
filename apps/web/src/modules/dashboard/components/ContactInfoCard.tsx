import { Box, Link as MuiLink, Stack, Typography } from '@mui/material'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'

import { alpha, brand, radius } from '@shared/theme/tokens'

import type { ContactInfoCardProps } from '../types/dashboard-overview'

export function ContactInfoCard({ label, name, phone }: ContactInfoCardProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        p: 1.4,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <PersonOutlineOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 18 }} />
        <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900, mt: 0.7 }}>
        {name}
      </Typography>
      <MuiLink
        href={`tel:${phone.replace(/\D/g, '')}`}
        underline="none"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          color: brand.magenta[600],
          fontSize: 12,
          fontWeight: 900,
          mt: 0.4,
        }}
      >
        <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
        {phone}
      </MuiLink>
    </Box>
  )
}
