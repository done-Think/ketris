'use client'

import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { buildPublicProfileAddress } from '@shared/utils/public-profile-handle'

import type { PublicProfileSidebarProps } from '../../types/profile-sidebar'
import { buildPublicProfileHref } from '../../utils/property-links'
import { getPublicProfileLink } from '../../utils/profile-listings'
import {
  styles,
  getButtonStyles,
  getButtonStyles2,
} from '../../styles/public-profile-sidebar.styles'

export function PublicProfileSidebar({
  accentColor,
  hoverColor,
  href,
  publicHandle,
  publicLinkEnabled = true,
  sourceType,
  linkDescription,
  phone,
  email,
  facts,
}: PublicProfileSidebarProps) {
  const t = useTranslations('marketplace.publicProfile.sidebar')
  const addressT = useTranslations('marketplace.profileAddress')
  const publicProfileHref = !publicLinkEnabled
    ? null
    : publicHandle
      ? { pathname: '/p/[handle]' as const, params: { handle: publicHandle } }
      : buildPublicProfileHref(href, sourceType)

  return (
    <Box sx={styles.box}>
      <Typography sx={styles.typography}>{t('publicLink')}</Typography>
      {publicProfileHref ? (
        <>
          <Typography sx={styles.typography2}>{linkDescription}</Typography>
          <Box sx={styles.box2}>
            <Typography sx={styles.typography3}>
              {publicHandle ? buildPublicProfileAddress(publicHandle) : getPublicProfileLink(href)}
            </Typography>
          </Box>
          <Box component={Link} href={publicProfileHref} sx={styles.box3}>
            <Button
              component="span"
              variant="outlined"
              color="secondary"
              fullWidth
              startIcon={<LinkOutlinedIcon sx={styles.linkOutlinedIcon} />}
              sx={getButtonStyles({ accentColor, hoverColor })}
            >
              {t('openOwnLink')}
            </Button>
          </Box>
        </>
      ) : (
        <Alert severity="info">{addressT('unpublishedHint')}</Alert>
      )}

      <Divider sx={styles.divider} />

      <Stack spacing={1}>
        <Button
          component="a"
          href={`tel:${phone.replace(/\D/g, '')}`}
          variant="contained"
          startIcon={<PhoneOutlinedIcon sx={styles.linkOutlinedIcon} />}
          sx={getButtonStyles2({ accentColor })}
        >
          {t('call')}
        </Button>
        <Button
          component="a"
          href={`mailto:${email}`}
          variant="outlined"
          color="secondary"
          startIcon={<EmailOutlinedIcon sx={styles.linkOutlinedIcon} />}
        >
          E-mail
        </Button>
      </Stack>

      <Divider sx={styles.divider2} />

      <Stack spacing={1}>
        {facts.map((fact) => (
          <Box key={fact.label}>
            <Typography sx={styles.typography4}>{fact.label}</Typography>
            <Typography sx={styles.typography5}>{fact.value}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
