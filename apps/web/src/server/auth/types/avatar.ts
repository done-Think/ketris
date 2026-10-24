export interface UploadAvatarInput {
  actorId: string
  actorTenantId: string
  filename: string
  contentType: string
  body: Buffer
}
export interface StoredAvatar {
  url: string
  contentType: string
}
export interface AvatarStorageInput {
  tenantId: string
  userId: string
  filename: string
  contentType: string
  body: Buffer
}
export interface AvatarMediaRouteContext {
  params: Promise<{ key: string[] }>
}
