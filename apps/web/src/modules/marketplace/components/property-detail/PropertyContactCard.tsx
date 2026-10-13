'use client'

import { useState } from 'react'
import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { useTranslations } from 'next-intl'

import { alpha, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { PropertyContactCardProps, PropertyInquiryMode } from '../../types/property-detail'
import { PropertyInquiryDialog } from './PropertyInquiryDialog'

export function PropertyContactCard({ property }: PropertyContactCardProps) {
  const t = useTranslations('marketplace.propertyDetail')
  const [inquiryMode, setInquiryMode] = useState<PropertyInquiryMode | null>(null)

  return (
    <Box
      sx={{
        position: { lg: 'sticky' },
        top: { lg: 84 },
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        p: 2,
      }}
    >
      <Typography color="primary" sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15 }}>
        {property.price}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, mb: 2 }}>
        {property.condominium
          ? t('condominium', { value: property.condominium })
          : t('condominiumNotInformed')}
      </Typography>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" size="large" fullWidth onClick={() => setInquiryMode('visit')}>
          {t('scheduleVisit')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          size="large"
          fullWidth
          onClick={() => setInquiryMode('proposal')}
        >
          {t('sendProposal')}
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" spacing={1.3} alignItems="center" sx={{ mb: 1.5 }}>
        <Avatar src={property.avatar} alt={property.broker} sx={{ width: 48, height: 48 }} />
        <Box>
          <Typography sx={{ fontWeight: 900 }}>{property.broker}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
            {t('brokerRole')}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1}>
        {[
          { label: t('contactActions.call'), icon: PhoneOutlinedIcon },
          { label: t('contactActions.whatsapp'), icon: PhoneOutlinedIcon },
          { label: t('contactActions.email'), icon: EmailOutlinedIcon },
        ].map(({ label, icon: Icon }) => (
          <Button
            key={label}
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<Icon sx={{ fontSize: iconSize.xs }} />}
            sx={{
              flex: 1,
              minWidth: 0,
              borderColor: 'divider',
              bgcolor: alpha.graphite[6],
              fontSize: 11,
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>

      {inquiryMode && (
        <PropertyInquiryDialog
          open
          mode={inquiryMode}
          propertyId={property.id}
          onClose={() => setInquiryMode(null)}
        />
      )}
    </Box>
  )
}
