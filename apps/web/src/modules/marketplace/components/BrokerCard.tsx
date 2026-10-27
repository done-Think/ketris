'use client'

import { type MouseEvent, useRef } from 'react'
import { Avatar, Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import type { BrokerCardProps } from '../types/broker'
import { buildPublicProfileHref } from '../utils/property-links'
import { DirectoryCardMetrics } from './directory/DirectoryCardMetrics'
import {
  styles,
  getCardContentStyles,
  getAvatarStyles,
  getDividerStyles,
} from '../styles/broker-card.styles'

export function BrokerCard(brokerCardProps: BrokerCardProps) {
  const t = useTranslations('marketplace.directory.cards')
  const profileLinkRef = useRef<HTMLAnchorElement | null>(null)
  const isListView = brokerCardProps.viewMode === 'list'

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest('a')) return

    profileLinkRef.current?.click()
  }

  return (
    <Card onClick={handleCardClick} sx={styles.card}>
      <Box
        component={Link}
        href={buildPublicProfileHref(brokerCardProps.href, 'broker')}
        aria-label={t('viewPublicPageAriaLabel', { name: brokerCardProps.name })}
        ref={profileLinkRef}
        sx={styles.box}
      />

      <CardContent sx={getCardContentStyles({ isListView })}>
        <Box sx={styles.box2}>
          <Stack direction="row" spacing={isListView ? 2.2 : 1.6} alignItems="flex-start">
            <Avatar
              src={brokerCardProps.avatar ?? undefined}
              alt={brokerCardProps.name}
              sx={getAvatarStyles({ isListView })}
            />

            <Box sx={styles.box3}>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={styles.box2}>
                  <Typography sx={styles.typography}>{brokerCardProps.name}</Typography>
                  <Typography sx={styles.typography2}>{brokerCardProps.creci}</Typography>
                </Box>
              </Stack>

              <Typography sx={styles.typography3}>{brokerCardProps.region}</Typography>
              {isListView ? (
                <Typography sx={styles.typography4}>{brokerCardProps.bio}</Typography>
              ) : null}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={styles.stack}>
            {brokerCardProps.specialties.map((specialty) => (
              <Chip key={specialty} label={specialty} size="small" sx={styles.chip} />
            ))}
          </Stack>

          <DirectoryCardMetrics
            gridTemplateColumns={{ xs: '1fr', sm: '2fr 0.85fr 0.85fr' }}
            labelFontWeight={800}
            metrics={[
              { label: t('region'), value: brokerCardProps.region ?? '', showTooltip: true },
              {
                label: t('properties'),
                value: t('activeProperties', { count: brokerCardProps.activeListings }),
              },
            ]}
            valueFontWeight={900}
          />
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
            <Typography sx={styles.typography5}>{t('viewPublicPage')}</Typography>
            <ChevronRightIcon sx={styles.chevronRightIcon} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
