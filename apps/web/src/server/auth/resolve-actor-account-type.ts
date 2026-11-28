import type { TenantAccountType } from './types/user-access'
import { authContainer } from './container'

/**
 * The tenant account type is read from the database, never from the token, so a stale or
 * tampered credential cannot change what an actor is allowed to do.
 */
export async function resolveActorAccountType(
  userId: string,
): Promise<TenantAccountType | undefined> {
  return (await authContainer.userRepository.findById(userId))?.tenantAccountType
}
