import type { Prisma } from '@prisma/client'

import type { ChargeAuditRecord, InsertChargeData } from '../types/charge-writes'

export async function recordChargeAudit(
  tx: Prisma.TransactionClient,
  record: ChargeAuditRecord,
): Promise<void> {
  await tx.chargeAuditEvent.create({
    data: {
      tenantId: record.tenantId,
      chargeId: record.chargeId,
      chargeCode: record.chargeCode,
      actorUserId: record.actorUserId,
      actorType: record.actorType ?? 'USER',
      action: record.action,
      changedFields: record.changedFields ?? [],
      fromStatus: record.fromStatus ?? null,
      toStatus: record.toStatus ?? null,
      reason: record.reason ?? null,
      receiptId: record.receiptId ?? null,
      snapshot: record.snapshot,
    },
  })
}

export async function nextChargeCode(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const prefix = `COB-${new Date().getFullYear()}-`
  const lock = `charges-code:${tenantId}:${prefix}`
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))::text`
  const suffixStart = prefix.length + 1
  const rows = await tx.$queryRaw<{ max: number | bigint | null }[]>`
    SELECT MAX(CAST(SUBSTRING("codigo" FROM ${suffixStart}::integer) AS BIGINT)) AS max
    FROM "cobrancas"
    WHERE "tenantId" = ${tenantId}
      AND "codigo" LIKE ${`${prefix}%`}
      AND SUBSTRING("codigo" FROM ${suffixStart}::integer) ~ '^[0-9]+$'
  `
  const next = BigInt(rows[0]?.max ?? 0) + 1n
  return `${prefix}${String(next).padStart(4, '0')}`
}

export async function insertCharge(
  tx: Prisma.TransactionClient,
  data: InsertChargeData,
): Promise<{ id: string }> {
  const codigo = await nextChargeCode(tx, data.tenantId)
  const created = await tx.cobranca.create({
    data: {
      tenantId: data.tenantId,
      contratoId: data.contractId,
      codigo,
      descricao: data.description,
      tipo: data.type,
      valor: data.amount,
      vencimento: data.dueDate,
      status: data.status,
      criadoPorId: data.createdById,
    },
    select: { id: true },
  })
  await recordChargeAudit(tx, {
    tenantId: data.tenantId,
    chargeId: created.id,
    chargeCode: codigo,
    actorUserId: data.createdById,
    actorType: data.actorType,
    action: 'CREATED',
    toStatus: data.status,
  })
  return created
}
