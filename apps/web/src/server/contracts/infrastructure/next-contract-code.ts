import type { ContractCodeSequenceRow } from '../types/prisma-contract-repository'
import type { Prisma } from '@prisma/client'

export async function nextContractCode(tx: Prisma.TransactionClient, tenantId: string) {
  const prefix = `CTR-${new Date().getFullYear()}-`
  const lock = `contracts-code:${tenantId}:${prefix}`
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))::text`
  const suffixStart = prefix.length + 1
  const rows = await tx.$queryRaw<ContractCodeSequenceRow[]>`
    SELECT MAX(CAST(SUBSTRING("code" FROM ${suffixStart}::integer) AS BIGINT)) AS max
    FROM "contracts"
    WHERE "tenantId" = ${tenantId}
      AND "code" LIKE ${`${prefix}%`}
      AND SUBSTRING("code" FROM ${suffixStart}::integer) ~ '^[0-9]+$'
  `
  const next = BigInt(rows[0]?.max ?? 0) + 1n
  return `${prefix}${String(next).padStart(4, '0')}`
}
