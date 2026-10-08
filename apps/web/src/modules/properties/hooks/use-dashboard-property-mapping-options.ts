'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { DashboardPropertyMappingOptions } from '../types/dashboard-property'

export function useDashboardPropertyMappingOptions(): DashboardPropertyMappingOptions {
  const locale = useLocale()
  const t = useTranslations('properties.dashboard.mapping')

  return useMemo(
    () => ({
      locale,
      messages: {
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
          priceAdjustment: t('activity.priceAdjustment'),
          visitScheduled: t('activity.visitScheduled'),
        },
        pricingDetails: {
          exempt: t('pricingDetails.exempt'),
          notApplicable: t('pricingDetails.notApplicable'),
          insuranceDeposit: t('pricingDetails.insuranceDeposit'),
          registrationPaused: t('pricingDetails.registrationPaused'),
          installmentsDeposit: t('pricingDetails.installmentsDeposit'),
          feeOnRent: t('pricingDetails.feeOnRent'),
          feeOnSale: t('pricingDetails.feeOnSale'),
          noRecentAdjustment: t('pricingDetails.noRecentAdjustment'),
          underDocumentaryReview: t('pricingDetails.underDocumentaryReview'),
          priceValidated: t('pricingDetails.priceValidated'),
          listingExpires: t('pricingDetails.listingExpires'),
          deactivated: t('pricingDetails.deactivated'),
        },
      },
    }),
    [locale, t],
  )
}
