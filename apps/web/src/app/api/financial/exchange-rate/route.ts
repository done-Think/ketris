import { NextResponse } from 'next/server'

import type { FinancialExchangeRate } from '@/modules/financial/utils/financial-display-currency'

type Quotation = {
  cotacaoVenda?: unknown
  dataHoraCotacao?: unknown
  tipoBoletim?: unknown
}

const baseUrl =
  'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)'

function ptaxDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${month}-${day}-${year}`
}

function rateFromRows(rows: unknown, currency: 'EUR' | 'USD'): FinancialExchangeRate | null {
  if (!Array.isArray(rows)) return null

  const closingRows = rows
    .filter((row): row is Quotation => row !== null && typeof row === 'object')
    .filter(
      (row) =>
        row.tipoBoletim === 'Fechamento' &&
        typeof row.dataHoraCotacao === 'string' &&
        /^\d{4}-\d{2}-\d{2} /.test(row.dataHoraCotacao) &&
        typeof row.cotacaoVenda === 'number' &&
        Number.isFinite(row.cotacaoVenda) &&
        row.cotacaoVenda > 0,
    )
    .sort((left, right) =>
      String(right.dataHoraCotacao).localeCompare(String(left.dataHoraCotacao)),
    )

  const latest = closingRows[0]
  if (!latest) return null

  return {
    currency,
    brlPerUnit: latest.cotacaoVenda as number,
    date: String(latest.dataHoraCotacao).slice(0, 10),
  }
}

export async function GET(request: Request) {
  const currency = new URL(request.url).searchParams.get('currency')
  if (currency !== 'EUR' && currency !== 'USD') {
    return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
  }

  const today = new Date()
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 14)
  const params = new URLSearchParams({
    '@moeda': `'${currency}'`,
    '@dataInicial': `'${ptaxDate(start)}'`,
    '@dataFinalCotacao': `'${ptaxDate(today)}'`,
    $format: 'json',
    $select: 'cotacaoVenda,dataHoraCotacao,tipoBoletim',
  })

  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      next: { revalidate: 60 * 60 },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) throw new Error(`PTAX returned ${response.status}`)

    const body: unknown = await response.json()
    const rows = body !== null && typeof body === 'object' && 'value' in body ? body.value : null
    const rate = rateFromRows(rows, currency)
    if (!rate) throw new Error('No closing PTAX quote available')

    return NextResponse.json(rate)
  } catch {
    return NextResponse.json({ error: 'Exchange rate unavailable' }, { status: 503 })
  }
}
