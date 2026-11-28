export type PrivacyPolicyPageProps = {
  /** Public origin of the site, used to show the full data deletion address. */
  siteOrigin: string
  /** Mailbox for privacy requests; null shows the agency administrator as the channel. */
  contactEmail: string | null
}
