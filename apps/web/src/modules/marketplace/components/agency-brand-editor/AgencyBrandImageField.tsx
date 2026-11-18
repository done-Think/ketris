'use client'

import { useTranslations } from 'next-intl'

import type { AgencyBrandImageFieldProps } from '../../types/agency-brand-editor'
import { SingleImageUploadField } from '../public-profile-editor/SingleImageUploadField'

export function AgencyBrandImageField({ control, name }: AgencyBrandImageFieldProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const isLogo = name === 'logoUrl'

  return (
    <SingleImageUploadField
      control={control}
      name={name}
      label={t(`fields.${name}`)}
      hint={t(isLogo ? 'brand.logoHint' : 'brand.bannerHint')}
      target={isLogo ? 'agency-logo' : 'agency-banner'}
      variant={isLogo ? 'avatar' : 'banner'}
    />
  )
}
