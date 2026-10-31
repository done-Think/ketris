import type { UserRole } from '@server/auth/domain/user.entity'

export type PublicProfileKind = 'broker' | 'agency'
export type PublicProfileTarget = { kind: PublicProfileKind; profileId: string }
export type PublicProfileAddress = PublicProfileTarget & { handle: string }
export type OwnPublicProfileAddress = PublicProfileTarget & { handle: string | null }
export type ProfileAddressActor = { actorId: string; actorTenantId: string; actorRole: UserRole }
export type ProfileAddressInput = ProfileAddressActor & { kind: PublicProfileKind }
export type ProfileAddressRouteContext = { params: Promise<{ kind: string }> }
