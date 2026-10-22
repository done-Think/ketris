import { Prisma } from '@prisma/client'

type SequentialCodeTable = 'cobrancas' | 'contratos'

/**
 * Próximo código `{prefixo}{NNNN}` (ex.: `COB-2026-0042`) a partir do maior número já usado com o
 * prefixo — e não da contagem de registros: excluir um registro não pode fazer o código repetir.
 * Códigos com sufixo não numérico (ex.: fixtures com UUID) são ignorados.
 *
 * Precisa ser chamado dentro de uma transação, com o insert na mesma transação: o advisory lock por
 * prefixo serializa quem gera códigos do mesmo prefixo até o commit, então dois pedidos simultâneos
 * não calculam o mesmo número.
 *
 * O `::integer` é obrigatório: o driver envia o parâmetro como texto, e `SUBSTRING(texto FROM
 * texto)` é a forma de expressão regular do Postgres, não a de posição.
 */
export async function nextSequentialCode(
  tx: Prisma.TransactionClient,
  table: SequentialCodeTable,
  prefix: string,
): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}::text))`

  const suffixStart = prefix.length + 1
  const rows = await tx.$queryRaw<{ max: number | bigint | null }[]>(Prisma.sql`
    SELECT MAX(CAST(SUBSTRING("codigo" FROM ${suffixStart}::integer) AS INTEGER)) AS max
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE "codigo" LIKE ${`${prefix}%`}
      AND SUBSTRING("codigo" FROM ${suffixStart}::integer) ~ '^[0-9]+$'
  `)
  const next = Number(rows[0]?.max ?? 0) + 1

  return `${prefix}${String(next).padStart(4, '0')}`
}
