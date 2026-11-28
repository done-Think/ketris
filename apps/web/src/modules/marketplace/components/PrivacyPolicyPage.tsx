'use client'

import { Box, Container, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { SiteFooter } from '@shared/components/layout'

import { instagramDataDeletionPath, privacyPolicyUpdatedAt } from '../config/privacy-policy'
import { useMarketplaceNavigation } from '../hooks/use-marketplace-navigation'
import { styles } from '../styles/privacy-policy-page.styles'
import type { PrivacyPolicyPageProps } from '../types/privacy-policy'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'
import { MarketplaceHeader } from './MarketplaceHeader'

export function PrivacyPolicyPage({ siteOrigin, contactEmail }: PrivacyPolicyPageProps) {
  const t = useTranslations('marketplace.privacy')
  const navigationT = useTranslations('marketplace')
  const formatter = useFormatter()
  const { footerColumns, legalLinks } = useMarketplaceNavigation()
  const deletionEndpoint = `${siteOrigin}${instagramDataDeletionPath}`

  return (
    <Box sx={styles.page}>
      <MarketplaceHeader />

      <Box component="main" sx={styles.main}>
        <Container maxWidth="lg">
          <MarketplaceBreadcrumbs
            items={[{ label: navigationT('navigation.home'), href: '/' }, { label: t('title') }]}
          />
          <Box component="article" sx={styles.article}>
            <Box component="header" sx={styles.header}>
              <Typography component="h1" variant="h3">
                {t('title')}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {t('updatedAt', {
                  date: formatter.dateTime(privacyPolicyUpdatedAt, { dateStyle: 'long' }),
                })}
              </Typography>
              <Typography>{t('intro')}</Typography>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.access.title')}
              </Typography>
              <Typography>{t('sections.access.intro')}</Typography>
              <Box component="ul" sx={styles.list}>
                <li>
                  <Typography>{t('sections.access.basic')}</Typography>
                </li>
                <li>
                  <Typography>{t('sections.access.publish')}</Typography>
                </li>
              </Box>
              <Typography>{t('sections.access.notAccessed')}</Typography>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.storage.title')}
              </Typography>
              <Typography>{t('sections.storage.token')}</Typography>
              <Typography>{t('sections.storage.photos')}</Typography>
              <Typography>{t('sections.storage.history')}</Typography>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.use.title')}
              </Typography>
              <Typography>{t('sections.use.body')}</Typography>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.disconnect.title')}
              </Typography>
              <Box component="ol" sx={styles.list}>
                <li>
                  <Typography>{t('sections.disconnect.ketris')}</Typography>
                </li>
                <li>
                  <Typography>{t('sections.disconnect.instagram')}</Typography>
                </li>
              </Box>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.deletion.title')}
              </Typography>
              <Typography sx={styles.breakable}>
                {t('sections.deletion.meta', { endpoint: deletionEndpoint })}
              </Typography>
              <Typography>{t('sections.deletion.kept')}</Typography>
              <Typography>
                {contactEmail
                  ? t('sections.deletion.email', { email: contactEmail })
                  : t('sections.deletion.emailFallback')}
              </Typography>
            </Box>

            <Box component="section" sx={styles.section}>
              <Typography component="h2" variant="h5">
                {t('sections.changes.title')}
              </Typography>
              <Typography>{t('sections.changes.body')}</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <SiteFooter columns={footerColumns} legalLinks={legalLinks} />
    </Box>
  )
}
