import type { InstagramConnection } from '../types/instagram'

export function instagramTokenContext(
  connection: Pick<InstagramConnection, 'tenantId' | 'connectedBy' | 'accountId'>,
) {
  return JSON.stringify([connection.tenantId, connection.connectedBy, connection.accountId])
}
