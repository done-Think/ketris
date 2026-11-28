import { createLocalizedMetadata } from '@/i18n/metadata'
import { getSiteOrigin } from '@/i18n/seo'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PrivacyPolicyPage } from '@modules/marketplace'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('marketplace.metadata.privacy', locale, '/privacy')
}

// Public page: no session is read, so Meta reviewers and visitors open it without login.
export default function PrivacyRoutePage() {
  return (
    <PrivacyPolicyPage
      siteOrigin={getSiteOrigin()}
      contactEmail={process.env.PRIVACY_CONTACT_EMAIL?.trim() || null}
    />
  )
}
