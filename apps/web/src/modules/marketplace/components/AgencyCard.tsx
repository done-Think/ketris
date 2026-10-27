'use client'

import { type MouseEvent, useRef } from 'react'
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import type { AgencyCardProps } from '../types/agency'
import { buildPublicProfileHref } from '../utils/property-links'
import { AgencyAdaptiveBrandHeader } from './AgencyAdaptiveBrandHeader'
import { DirectoryCardMetrics } from './directory/DirectoryCardMetrics'
import {
  styles,
  getCardContentStyles,
  getBoxStyles,
  getBoxStyles2,
  getBoxStyles3,
  getDividerStyles,
} from '../styles/agency-card.styles'

export function AgencyCard(agency: AgencyCardProps) {
  const t = useTranslations('marketplace.directory.cards')
  const profileLinkRef = useRef<HTMLAnchorElement | null>(null)
  const isListView = agency.viewMode === 'list'

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest('a')) return

    profileLinkRef.current?.click()
  }

  return (
    <Card onClick={handleCardClick} sx={styles.card}>
      <Box
        component={Link}
        href={buildPublicProfileHref(agency.href, 'agency')}
        aria-label={t('viewPublicPageAriaLabel', { name: agency.name })}
        ref={profileLinkRef}
        sx={styles.box}
      />

      <CardContent sx={getCardContentStyles({ isListView })}>
        <Box sx={getBoxStyles({ isListView })}>
          <Box sx={getBoxStyles2({ isListView })}>
            <AgencyAdaptiveBrandHeader
              agency={agency}
              variant={isListView ? 'list' : 'compact'}
              showBanner
              showHeadquarters={isListView}
            />
          </Box>

          {!isListView && agency.headquarters ? (
            <Typography sx={styles.typography}>{agency.headquarters}</Typography>
          ) : null}

          {isListView && agency.summary ? (
            <Typography sx={styles.typography2}>{agency.summary}</Typography>
          ) : null}

          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={styles.stack}>
            {agency.segments.slice(0, 3).map((segment) => (
              <Chip key={segment} label={segment} size="small" sx={styles.chip} />
            ))}
          </Stack>

          <Box sx={getBoxStyles3({ isListView })}>
            <DirectoryCardMetrics
              gridTemplateColumns={
                isListView
                  ? { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(2, minmax(160px, 0.28fr))' }
                  : 'repeat(2, minmax(0, 1fr))'
              }
              labelFontWeight={700}
              metrics={[
                {
                  label: t('properties'),
                  value: agency.activeListings,
                  icon: ApartmentOutlinedIcon,
                },
                { label: t('team'), value: agency.brokersCount, icon: GroupsOutlinedIcon },
              ]}
              valueFontWeight={700}
            />
          </Box>
        </Box>

        <Box>
          <Divider sx={getDividerStyles({ isListView })} />

          <Stack
            component="span"
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={0.35}
            sx={styles.stack2}
          >
            <Typography sx={styles.typography3}>{t('viewPublicPage')}</Typography>
            <ChevronRightIcon sx={styles.chevronRightIcon} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
