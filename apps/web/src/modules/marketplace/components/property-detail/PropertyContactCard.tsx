'use client'

import { useState } from 'react'
import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { useTranslations } from 'next-intl'

import type { PropertyContactCardProps, PropertyInquiryMode } from '../../types/property-detail'
import { PropertyInquiryDialog } from './PropertyInquiryDialog'
import { styles } from '../../styles/property-contact-card.styles'

export function PropertyContactCard({ property }: PropertyContactCardProps) {
  const t = useTranslations('marketplace.propertyDetail')
  const [inquiryMode, setInquiryMode] = useState<PropertyInquiryMode | null>(null)

  return (
    <Box sx={styles.box}>
      <Typography color="primary" sx={styles.typography}>
        {property.price}
      </Typography>
      <Typography sx={styles.typography2}>
        {property.condominium
          ? t('condominium', { value: property.condominium })
          : t('condominiumNotInformed')}
      </Typography>

      <Stack spacing={1} sx={styles.stack}>
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

      <Divider sx={styles.stack} />

      <Stack direction="row" spacing={1.3} alignItems="center" sx={styles.stack2}>
        <Avatar src={property.avatar} alt={property.broker} sx={styles.avatar} />
        <Box>
          <Typography sx={styles.typography3}>{property.broker}</Typography>
          <Typography sx={styles.typography4}>{t('brokerRole')}</Typography>
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
            startIcon={<Icon sx={styles.icon} />}
            sx={styles.button}
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
