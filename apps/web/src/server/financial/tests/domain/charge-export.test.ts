import { describe, expect, it } from 'vitest'

import { chargesCsvFileName, chargesToCsv } from '../../domain/charge-export'

const row = {
  code: 'COB-2026-0001',
  description: 'Aluguel; outubro',
  propertyTitle: 'Casa "Azul"',
  payerName: '=HYPERLINK("x")',
  type: 'A_PAGAR' as const,
  dueDate: new Date('2026-10-05T00:00:00.000Z'),
  amount: 1234.5,
  status: 'PAGA' as const,
  paidAt: new Date('2026-10-04T00:00:00.000Z'),
  paymentMethod: 'PIX',
}

describe('chargesToCsv', () => {
  it('gera CSV para Excel em português: BOM, ";" e decimal com vírgula', () => {
    const csv = chargesToCsv([row], 'pt-BR')
    const [header, line] = csv.replace('﻿', '').trim().split('\r\n')

    expect(csv.startsWith('﻿')).toBe(true)
    expect(header).toBe(
      'Código;Descrição;Imóvel;Locatário;Tipo;Vencimento;Valor;Status;Pago em;Forma de pagamento',
    )
    expect(line).toBe(
      'COB-2026-0001;"Aluguel; outubro";"Casa ""Azul""";"\'=HYPERLINK(""x"")";A pagar;05/10/2026;1234,50;Paga;04/10/2026;PIX',
    )
  })

  it('traduz cabeçalho e rótulos, mantendo o formato numérico', () => {
    const csv = chargesToCsv([{ ...row, status: 'ATRASADA', paidAt: null }], 'en-US')

    expect(csv).toContain('Code;Description;Property')
    expect(csv).toContain(';Payable;05/10/2026;1234,50;Overdue;;PIX')
  })

  it('nomeia o arquivo pelo mês', () => {
    expect(chargesCsvFileName(2026, 3)).toBe('cobrancas-2026-03.csv')
  })
})
