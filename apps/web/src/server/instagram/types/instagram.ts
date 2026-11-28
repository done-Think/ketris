import type { UserRole } from '@server/auth/domain/user.entity'

export type InstagramActor = { tenantId: string; id: string; role: UserRole }
export type InstagramConnection = {
  tenantId: string
  accountId: string
  oauthUserId: string
  username: string
  encryptedToken: string
  expiresAt: Date
  refreshedAt: Date
  revision: string
  connectedBy: string
}
export type InstagramState = {
  hash: string
  tenantId: string
  actorId: string
  verifierHash: string
  expiresAt: Date
}
export type InstagramStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'READY'
  | 'PUBLISHING'
  | 'VERIFYING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED'
export type InstagramPublication = {
  id: string
  tenantId: string
  propertyId: string
  accountId: string
  oauthUserId: string
  connectionRevision: string
  requestedBy: string
  dedupeKey: string
  caption: string
  imageUrls: string[]
  preparedKeys: string[]
  status: InstagramStatus
  containerId: string | null
  mediaId: string | null
  permalink: string | null
  lastErrorCode: string | null
  attempts: number
  leaseToken: string | null
  createdAt: Date
}
export type NewInstagramPublication = Pick<
  InstagramPublication,
  | 'tenantId'
  | 'propertyId'
  | 'accountId'
  | 'oauthUserId'
  | 'connectionRevision'
  | 'requestedBy'
  | 'dedupeKey'
  | 'caption'
  | 'imageUrls'
>
export type InstagramPublicationPatch = Partial<
  Pick<
    InstagramPublication,
    'status' | 'containerId' | 'mediaId' | 'permalink' | 'lastErrorCode' | 'preparedKeys'
  >
> & { nextAttemptAt?: Date }
export type InstagramProperty = {
  id: string
  tenantId: string
  responsibleId: string
  ownerId: string | null
  status: string
  mediaUrls: string[]
}
export type InstagramToken = { accessToken: string; expiresIn: number }
export type InstagramIdentity = { accountId: string; oauthUserId: string; username: string }
export type InstagramConfig = {
  appId: string
  appSecret: string
  redirectUri: string
  graphVersion: string
  mediaOrigin: string
  encryptionKey: Buffer
}
// How long one worker run keeps polling Meta while it still processes the photos.
export type InstagramProcessOptions = { waitForMediaMs?: number }
