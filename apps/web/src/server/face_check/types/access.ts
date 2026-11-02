import type { PrismaClient } from '@prisma/client'

export interface FaceCheckActor {
  actorId: string
  tenantId: string
  role: 'OWNER' | 'AGENT'
  accountType: 'AGENCY' | 'BROKER'
  agencyName: string
}

export type FaceCheckDatabase = PrismaClient
export type FaceCheckScope = { actor: FaceCheckActor } | { token: string }
