import type { Prisma } from '@prisma/client'

import type {
  ChargeAuditAction,
  ChargeAuditActorType,
  ChargeType,
  StoredChargeStatus,
} from './charge'

export interface ChargeAuditRecord {
  tenantId: string
  chargeId: string | null
  chargeCode: string
  actorUserId: string | null
  actorType?: ChargeAuditActorType
  action: ChargeAuditAction
  changedFields?: string[]
  fromStatus?: StoredChargeStatus | null
  toStatus?: StoredChargeStatus | null
  reason?: string | null
  receiptId?: string | null
  snapshot?: Prisma.InputJsonValue
}

export interface InsertChargeData {
  tenantId: string
  contractId: string | null
  description: string | null
  type: ChargeType
  amount: number | Prisma.Decimal
  dueDate: Date
  status: StoredChargeStatus
  createdById: string | null
  actorType?: ChargeAuditActorType
}
