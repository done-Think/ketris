import { createHash, randomUUID } from 'node:crypto'
import { vi } from 'vitest'
import type {
  InstagramApi,
  InstagramMedia,
  InstagramTokenVault,
} from '../../application/ports/instagram-api.port'
import type { InstagramRepository } from '../../application/ports/instagram-repository.port'
import type {
  InstagramConnection,
  InstagramPublication,
  InstagramActor,
} from '../../types/instagram'

export const actor: InstagramActor = { tenantId: 'tenant-a', id: 'owner-a', role: 'OWNER' }
export function connection(): InstagramConnection {
  return {
    tenantId: actor.tenantId,
    accountId: '123',
    oauthUserId: '456',
    username: 'monkeystecnologia',
    encryptedToken: 'ciphertext',
    expiresAt: new Date(Date.now() + 30 * 86400_000),
    refreshedAt: new Date(),
    revision: 'revision-1',
    connectedBy: actor.id,
  }
}
export function publication(): InstagramPublication {
  return {
    id: 'job-1',
    tenantId: actor.tenantId,
    propertyId: 'property-a',
    oauthUserId: '456',
    accountId: '123',
    connectionRevision: 'revision-1',
    requestedBy: actor.id,
    dedupeKey: 'dedupe',
    caption: 'Apartment',
    imageUrls: ['/api/properties/media/properties/tenant-a/photo.jpg'],
    preparedKeys: [],
    status: 'QUEUED',
    containerId: null,
    mediaId: null,
    permalink: null,
    lastErrorCode: null,
    attempts: 1,
    leaseToken: 'lease',
    createdAt: new Date(),
  }
}
export function dependencies() {
  const repository = {
    actor: vi.fn<InstagramRepository['actor']>().mockResolvedValue(actor),
    saveState: vi.fn<InstagramRepository['saveState']>().mockResolvedValue(undefined),
    consumeState: vi.fn<InstagramRepository['consumeState']>().mockResolvedValue(true),
    connection: vi.fn<InstagramRepository['connection']>().mockResolvedValue(connection()),
    saveConnection: vi.fn<InstagramRepository['saveConnection']>().mockResolvedValue(undefined),
    refreshConnection: vi.fn<InstagramRepository['refreshConnection']>().mockResolvedValue(true),
    disconnect: vi.fn<InstagramRepository['disconnect']>().mockResolvedValue(undefined),
    deleteByOAuthUser: vi
      .fn<InstagramRepository['deleteByOAuthUser']>()
      .mockResolvedValue(undefined),
    deletionMediaKeys: vi.fn<InstagramRepository['deletionMediaKeys']>().mockResolvedValue([]),
    expiringConnections: vi.fn<InstagramRepository['expiringConnections']>().mockResolvedValue([]),
    property: vi.fn<InstagramRepository['property']>().mockResolvedValue({
      id: 'property-a',
      tenantId: actor.tenantId,
      responsibleId: actor.id,
      ownerId: actor.id,
      status: 'PUBLISHED',
      mediaUrls: publication().imageUrls,
    }),
    enqueue: vi.fn<InstagramRepository['enqueue']>().mockResolvedValue(publication()),
    publications: vi.fn<InstagramRepository['publications']>().mockResolvedValue([]),
    publication: vi.fn<InstagramRepository['publication']>().mockResolvedValue(publication()),
    claim: vi.fn<InstagramRepository['claim']>().mockResolvedValue(publication()),
    patch: vi.fn<InstagramRepository['patch']>().mockImplementation(async (job, patch) => {
      Object.assign(job, patch)
    }),
    release: vi.fn<InstagramRepository['release']>().mockResolvedValue(undefined),
    retry: vi.fn<InstagramRepository['retry']>().mockResolvedValue(false),
    cleanupStates: vi.fn<InstagramRepository['cleanupStates']>().mockResolvedValue(undefined),
  } satisfies InstagramRepository
  const api = {
    authorizeUrl: vi
      .fn<InstagramApi['authorizeUrl']>()
      .mockReturnValue('https://www.instagram.com/oauth/authorize'),
    exchange: vi.fn<InstagramApi['exchange']>().mockResolvedValue({
      accessToken: 'private-token',
      expiresIn: 5184000,
      accountId: '123',
      oauthUserId: '456',
      username: 'monkeystecnologia',
    }),
    refresh: vi
      .fn<InstagramApi['refresh']>()
      .mockResolvedValue({ accessToken: 'new-private-token', expiresIn: 5184000 }),
    createImage: vi.fn<InstagramApi['createImage']>().mockResolvedValue('container-1'),
    createCarousel: vi.fn<InstagramApi['createCarousel']>().mockResolvedValue('carousel-1'),
    containerStatus: vi.fn<InstagramApi['containerStatus']>().mockResolvedValue('FINISHED'),
    publish: vi.fn<InstagramApi['publish']>().mockResolvedValue('media-1'),
    permalink: vi
      .fn<InstagramApi['permalink']>()
      .mockResolvedValue('https://www.instagram.com/p/example/'),
    checkLimit: vi.fn<InstagramApi['checkLimit']>().mockResolvedValue(undefined),
  } satisfies InstagramApi
  const vault = {
    random: vi.fn<InstagramTokenVault['random']>().mockImplementation(() => randomUUID()),
    digest: vi
      .fn<InstagramTokenVault['digest']>()
      .mockImplementation((value) => createHash('sha256').update(value).digest('hex')),
    encrypt: vi.fn<InstagramTokenVault['encrypt']>().mockReturnValue('ciphertext'),
    decrypt: vi.fn<InstagramTokenVault['decrypt']>().mockReturnValue('private-token'),
  } satisfies InstagramTokenVault
  const media = {
    prepare: vi.fn<InstagramMedia['prepare']>().mockResolvedValue(['prepared.jpg']),
    url: vi
      .fn<InstagramMedia['url']>()
      .mockReturnValue('https://ketris.example/photo.jpg?signature=signed'),
    remove: vi.fn<InstagramMedia['remove']>().mockResolvedValue(undefined),
  } satisfies InstagramMedia
  return { repository, api, vault, media }
}
