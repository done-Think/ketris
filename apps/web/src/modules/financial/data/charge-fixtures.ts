import type { Charge } from '../types/charge'

// The demo represents March 2025, independently of the device's current date.
export const chargeDemoMonth = '2025-03'

const chargeRows: Omit<Charge, 'competence' | 'history'>[] = [
  {
    id: '0341',
    code: '#COB-2025-0341',
    direction: 'receivable',
    tenant: 'Bruno Oliveira',
    property: 'Apt Jardins 3q - 12',
    amount: 4500,
    dueDate: '2025-03-05',
    status: 'paid',
  },
  {
    id: '0340',
    code: '#COB-2025-0340',
    direction: 'receivable',
    tenant: 'Mariana Souza',
    property: 'Studio Pinheiros',
    amount: 2800,
    dueDate: '2025-03-10',
    status: 'pending',
  },
  {
    id: '0339',
    code: '#COB-2025-0339',
    direction: 'receivable',
    tenant: 'Carlos Eduardo',
    property: 'Casa Morumbi 4q',
    amount: 9200,
    dueDate: '2025-03-01',
    status: 'overdue',
  },
  {
    id: '0338',
    code: '#COB-2025-0338',
    direction: 'receivable',
    tenant: 'Ana Julia Costa',
    property: 'Apt Brooklin 2q',
    amount: 3600,
    dueDate: '2025-03-15',
    status: 'scheduled',
  },
  {
    id: '0337',
    code: '#COB-2025-0337',
    direction: 'receivable',
    tenant: 'Rodrigo Santos',
    property: 'Sala Com. Paulista',
    amount: 5400,
    dueDate: '2025-03-05',
    status: 'paid',
  },
  {
    id: '0336',
    code: '#COB-2025-0336',
    direction: 'receivable',
    tenant: 'Beatriz Mello',
    property: 'Cobertura Itaim',
    amount: 15000,
    dueDate: '2025-02-28',
    status: 'cancelled',
  },
  {
    id: '0335',
    code: '#COB-2025-0335',
    direction: 'receivable',
    tenant: 'Lucas Almeida',
    property: 'Loft Vila Madalena',
    amount: 3100,
    dueDate: '2025-03-20',
    status: 'pending',
  },
  {
    id: '0334',
    code: '#COB-2025-0334',
    direction: 'payable',
    tenant: 'Condomínio Jardins',
    property: 'Apt Jardins 3q - 12',
    amount: 1100,
    dueDate: '2025-03-08',
    status: 'pending',
  },
  {
    id: '0333',
    code: '#COB-2025-0333',
    direction: 'payable',
    tenant: 'Energia Paulista',
    property: 'Studio Pinheiros',
    amount: 420,
    dueDate: '2025-03-02',
    status: 'paid',
  },
  {
    id: '0332',
    code: '#COB-2025-0332',
    direction: 'payable',
    tenant: 'Internet Fibra',
    property: 'Casa Morumbi 4q',
    amount: 180,
    dueDate: '2025-03-12',
    status: 'scheduled',
  },
]

const chargeLinks: Record<string, Pick<Charge, 'contractCode' | 'contact' | 'address'>> = {
  '0341': {
    contractCode: '#CTR-2025-0087',
    contact: 'bruno.oliveira@example.com',
    address: 'Alameda Lorena, 1420 - Jardins, São Paulo - SP',
  },
  '0340': {
    contractCode: '#CTR-2025-0088',
    contact: 'mariana.souza@example.com',
    address: 'Rua dos Pinheiros, 200 - Pinheiros, São Paulo - SP',
  },
  '0339': {
    contractCode: '#CTR-2025-0089',
    contact: 'carlos.eduardo@example.com',
    address: 'Rua São Paulo Antigo, 300 - Morumbi, São Paulo - SP',
  },
  '0338': {
    contractCode: '#CTR-2025-0090',
    contact: 'ana.costa@example.com',
    address: 'Rua Michigan, 400 - Brooklin, São Paulo - SP',
  },
  '0337': {
    contractCode: '#CTR-2025-0091',
    contact: 'rodrigo.santos@example.com',
    address: 'Avenida Paulista, 500 - Bela Vista, São Paulo - SP',
  },
  '0336': {
    contractCode: '#CTR-2025-0092',
    contact: 'beatriz.mello@example.com',
    address: 'Rua João Cachoeira, 600 - Itaim, São Paulo - SP',
  },
  '0335': {
    contractCode: '#CTR-2025-0093',
    contact: 'lucas.almeida@example.com',
    address: 'Rua Harmonia, 700 - Vila Madalena, São Paulo - SP',
  },
  '0334': {
    contact: 'condominio.jardins@example.com',
    address: 'Alameda Lorena, 1420 - Jardins, São Paulo - SP',
  },
  '0333': {
    contact: 'energia.paulista@example.com',
    address: 'Rua dos Pinheiros, 200 - Pinheiros, São Paulo - SP',
  },
  '0332': {
    contact: 'internet.fibra@example.com',
    address: 'Rua São Paulo Antigo, 300 - Morumbi, São Paulo - SP',
  },
}

export const chargeFixtures: readonly Charge[] = chargeRows.map((charge) => {
  const payment =
    charge.status === 'paid'
      ? {
          paymentDate: charge.dueDate,
          paymentMethod: charge.direction === 'receivable' ? 'PIX' : 'Boleto',
        }
      : undefined
  return {
    ...charge,
    ...chargeLinks[charge.id],
    competence: charge.dueDate.slice(0, 7),
    payment,
    receiptReference: payment ? `REC-${charge.id}` : undefined,
    history: [
      { type: 'generated', date: `${charge.dueDate.slice(0, 7)}-01` },
      ...(payment ? [{ type: 'received' as const, date: payment.paymentDate }] : []),
    ],
  }
})
