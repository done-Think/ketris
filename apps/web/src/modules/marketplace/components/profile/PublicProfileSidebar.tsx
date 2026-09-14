'use client'

import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { PublicProfileSidebarProps } from '../../types/profile-sidebar'
import { buildPublicProfileHref } from '../../utils/property-links'
import { getPublicProfileLink } from '../../utils/profile-listings'

export function PublicProfileSidebar({
  accentColor,
  hoverColor,
  href,
  sourceType,
  linkDescription,
  phone,
  email,
  facts,
}: PublicProfileSidebarProps) {
  const t = useTranslations('marketplace.publicProfile.sidebar')
  const publicProfileHref = buildPublicProfileHref(href, sourceType)

  return (
    <Box
      sx={{
        alignSelf: 'start',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.propertyCard,
        p: 2,
      }}
    >
      <Typography sx={{ ...componentText.cardTitle, mb: 0.8 }}>{t('publicLink')}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500, mb: 1.5 }}>
        {linkDescription}
      </Typography>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.app,
          px: 1.2,
          py: 1,
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-word' }}>
          {getPublicProfileLink(href)}
        </Typography>
      </Box>
      <Box
        component={Link}
        href={publicProfileHref}
        sx={{ display: 'block', textDecoration: 'none' }}
      >
        <Button
          component="span"
          variant="outlined"
          color="secondary"
          fullWidth
          startIcon={<LinkOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
          sx={{
            mb: 2,
            borderColor: accentColor,
            color: accentColor,
            '&:hover': {
              borderColor: accentColor,
              bgcolor: hoverColor,
            },
          }}
        >
          {t('openOwnLink')}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1}>
        <Button
          component="a"
          href={`tel:${phone.replace(/\D/g, '')}`}
          variant="contained"
          startIcon={<PhoneOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
          sx={{
            bgcolor: accentColor,
            '&:hover': {
              bgcolor: accentColor,
              filter: 'brightness(0.92)',
            },
          }}
        >
          {t('call')}
        </Button>
        <Button
          component="a"
          href={`mailto:${email}`}
          variant="outlined"
          color="secondary"
          startIcon={<EmailOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        >
          E-mail
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1}>
        {facts.map((fact) => (
          <Box key={fact.label}>
            <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 500 }}>
              {fact.label}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{fact.value}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
