export type InstagramConnectionState = {
  configured: boolean
  connected: boolean
  accountId?: string
  username?: string
  expiresAt?: string
  expired?: boolean
}
export type InstagramPublicationState = {
  id: string
  propertyId: string
  accountId: string
  status:
    | 'QUEUED'
    | 'PREPARING'
    | 'READY'
    | 'PUBLISHING'
    | 'VERIFYING'
    | 'PUBLISHED'
    | 'FAILED'
    | 'BLOCKED'
    | 'CANCELLED'
  permalink: string | null
  errorCode: string | null
  createdAt: string
}
export type InstagramPublicationInput = { caption: string; imageUrls: string[] }
export type InstagramPostEditorProps = {
  images: string[]
  selected: string[]
  caption: string
  onSelectionChange: (images: string[]) => void
  onCaptionChange: (caption: string) => void
  disabled?: boolean
}
