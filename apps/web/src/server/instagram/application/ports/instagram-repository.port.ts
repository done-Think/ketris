import type {
  InstagramActor,
  InstagramConnection,
  InstagramPublication,
  InstagramPublicationPatch,
  InstagramProperty,
  InstagramState,
  NewInstagramPublication,
} from '../../types/instagram'

export interface InstagramRepository {
  saveState(state: InstagramState): Promise<void>
  consumeState(
    hash: string,
    verifierHash: string,
    tenantId: string,
    actorId: string,
  ): Promise<boolean>
  actor(tenantId: string, userId: string): Promise<InstagramActor | null>
  connection(tenantId: string, userId: string): Promise<InstagramConnection | null>
  saveConnection(connection: InstagramConnection): Promise<void>
  refreshConnection(connection: InstagramConnection): Promise<boolean>
  disconnect(tenantId: string, userId: string): Promise<void>
  deleteByOAuthUser(userId: string): Promise<void>
  deletionMediaKeys(userId: string): Promise<string[]>
  expiringConnections(): Promise<InstagramConnection[]>
  property(tenantId: string, propertyId: string): Promise<InstagramProperty | null>
  enqueue(input: NewInstagramPublication): Promise<InstagramPublication>
  publications(
    tenantId: string,
    propertyId: string,
    userId: string,
  ): Promise<InstagramPublication[]>
  publication(id: string): Promise<InstagramPublication | null>
  claim(id?: string): Promise<InstagramPublication | null>
  patch(job: InstagramPublication, patch: InstagramPublicationPatch): Promise<void>
  release(job: InstagramPublication): Promise<void>
  retry(tenantId: string, userId: string, id: string): Promise<boolean>
  cleanupStates(): Promise<void>
}
