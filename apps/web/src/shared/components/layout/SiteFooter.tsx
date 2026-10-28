'use client'

import { styles } from '@shared/styles/site-footer.styles'

import {
  Box,
  Container,
  Divider,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'

import type { SiteFooterProps } from '@shared/types/site-footer'

const socialLinks = [
  { label: 'Instagram', icon: InstagramIcon },
  { label: 'Facebook', icon: FacebookOutlinedIcon },
  { label: 'LinkedIn', icon: LinkedInIcon },
] as const

export function SiteFooter({ columns, legalLinks }: SiteFooterProps) {
  const t = useTranslations('marketplace.footer')

  return (
    <Box component="footer" sx={styles.box}>
      <Container maxWidth="xl">
        <Box sx={styles.box2}>
          <Box sx={styles.box3}>
            <AppLogo
              src={ketrisLogoFooter}
              width={{ xs: 92, md: 102 }}
              marginBottom={{ xs: 0.6, md: 2 }}
            />
            <Typography sx={styles.typography}>{t('description')}</Typography>
            <Stack
              direction="row"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              spacing={1.2}
              sx={styles.stack}
            >
              {socialLinks.map(({ label, icon: Icon }) => (
                <IconButton key={label} aria-label={label} size="small" sx={styles.iconButton}>
                  <Icon sx={styles.icon} />
                </IconButton>
              ))}
            </Stack>
          </Box>

          <Box sx={styles.box4}>
            {columns.map((column) => (
              <Box key={column.title} sx={styles.box5}>
                <Typography sx={styles.typography2}>{column.title}</Typography>
                <Stack
                  direction={{ xs: 'row', md: 'column' }}
                  spacing={{ xs: 0.8, md: 1.25 }}
                  useFlexGap
                  flexWrap="wrap"
                  alignItems={{ md: 'flex-end' }}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  {column.links.map((item) => (
                    <MuiLink
                      key={item.label}
                      component={Link}
                      href={item.href}
                      underline="none"
                      sx={styles.muiLink}
                    >
                      {item.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={styles.divider} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'center', sm: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 1.4, sm: 2 }}
          sx={styles.stack2}
        >
          <Typography sx={styles.typography3}>
            © 2026{' '}
            <MuiLink
              href="https://www.donethink.com/"
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={styles.muiLink2}
            >
              doneThink
            </MuiLink>{' '}
            {t('rights')}
          </Typography>
          <Stack direction="row" spacing={3}>
            {legalLinks.map((item) => (
              <MuiLink
                key={item.label}
                component={Link}
                href={item.href}
                underline="none"
                sx={styles.muiLink3}
              >
                {item.label}
              </MuiLink>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
