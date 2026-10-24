'use client'

import { isAppLocale, defaultLocale } from '@/i18n/routing'

import { useMemo } from 'react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'

import type { DashboardPropertyMappingOptions } from '../types/dashboard-property'

export function useDashboardPropertyMappingOptions(): DashboardPropertyMappingOptions {
  const requestedLocale = useLocale()
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale
  const formatter = useFormatter()
  const t = useTranslations('properties.dashboard.mapping')
  const mediaT = useTranslations('properties.detail.mediaKinds')

  return useMemo(
    () => ({
      locale,
      formatter,
      messages: {
        mediaKinds: {
          photo: mediaT('photo'),
          floorPlan: mediaT('floorPlan'),
          video: mediaT('video'),
        },
        notAnnounced: t('notAnnounced'),
        notInformed: t('notInformed'),
        unknownAddress: t('unknownAddress'),
        monthlySuffix: t('monthlySuffix'),
        purposes: {
          rent: t('purposes.rent'),
          sale: t('purposes.sale'),
        },
        propertyTypes: {
          apartment: t('propertyTypes.apartment'),
          house: t('propertyTypes.house'),
          studio: t('propertyTypes.studio'),
          penthouse: t('propertyTypes.penthouse'),
          commercial: t('propertyTypes.commercial'),
          loft: t('propertyTypes.loft'),
          other: t('propertyTypes.other'),
        },
        activity: {
          created: t('activity.created'),
          published: t('activity.published'),
          updated: t('activity.updated'),
          contractLinked: t('activity.contractLinked'),
          photosUpdated: t('activity.photosUpdated'),
          markedAsRented: t('activity.markedAsRented'),
          proposalApproved: t('activity.proposalApproved'),
          activatedForSale: t('activity.activatedForSale'),
          documentationSubmitted: t('activity.documentationSubmitted'),
          listingExpiringSoon: t('activity.listingExpiringSoon'),
          markedAsInactive: t('activity.markedAsInactive'),
          priceAdjustment: t.raw('activity.priceAdjustment'),
          visitScheduled: t.raw('activity.visitScheduled'),
        },
        pricingDetails: {
          exempt: t('pricingDetails.exempt'),
          notApplicable: t('pricingDetails.notApplicable'),
          insuranceDeposit: t('pricingDetails.insuranceDeposit'),
          registrationPaused: t('pricingDetails.registrationPaused'),
          installmentsDeposit: t.raw('pricingDetails.installmentsDeposit'),
          feeOnRent: t.raw('pricingDetails.feeOnRent'),
          feeOnSale: t.raw('pricingDetails.feeOnSale'),
          noRecentAdjustment: t('pricingDetails.noRecentAdjustment'),
          underDocumentaryReview: t('pricingDetails.underDocumentaryReview'),
          priceValidated: t('pricingDetails.priceValidated'),
          listingExpires: t('pricingDetails.listingExpires'),
          deactivated: t('pricingDetails.deactivated'),
        },
      },
    }),
    [locale, formatter, t, mediaT],
  )
}
