import { proposalStatusPresentations } from '../config/proposal-statuses'
import type {
  ProposalManagementDetail,
  ProposalManagementListItem,
  ProposalManagementStatus,
  ProposalManagementStatusCounts,
  ProposalManagementSummary,
  ProposalTransactionKind,
} from '../types/proposal-management'

type ProposalFixtureInput = {
  sequence: number
  leadName: string
  leadEmail: string
  propertyTitle: string
  propertyAddress: string
  amount: number
  transactionKind: ProposalTransactionKind
  status: ProposalManagementStatus
  createdAt: string
  createdLabel: string
}

const leadAvatarUrls = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80',
] as const

const propertyThumbnailUrls = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=240&q=82',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=240&q=82',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=240&q=80',
] as const

const marinaCosta = {
  id: 'broker-marina-costa',
  name: 'Marina Costa',
  email: 'marina.costa@ketris.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&q=80',
} as const

function formatFixtureValue(amount: number, transactionKind: ProposalTransactionKind): string {
  const value = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return `R$ ${value}${transactionKind === 'rent' ? '/mês' : ''}`
}

function createProposalFixture(
  input: ProposalFixtureInput,
  fixtureIndex: number,
): ProposalManagementListItem {
  const paddedSequence = String(input.sequence).padStart(4, '0')

  return {
    id: `prp-${paddedSequence}`,
    reference: `#PRP-${paddedSequence}`,
    lead: {
      id: `lead-prp-${paddedSequence}`,
      name: input.leadName,
      email: input.leadEmail,
      avatarUrl: leadAvatarUrls[fixtureIndex % leadAvatarUrls.length],
    },
    property: {
      id: `property-prp-${paddedSequence}`,
      title: input.propertyTitle,
      address: input.propertyAddress,
      thumbnailUrl: propertyThumbnailUrls[fixtureIndex % propertyThumbnailUrls.length],
    },
    amount: input.amount,
    transactionKind: input.transactionKind,
    valueLabel: formatFixtureValue(input.amount, input.transactionKind),
    status: input.status,
    createdAt: input.createdAt,
    createdLabel: input.createdLabel,
  }
}

const proposalFixtureInputs: readonly ProposalFixtureInput[] = [
  {
    sequence: 42,
    leadName: 'Bruno Oliveira',
    leadEmail: 'bruno@fintrex.com',
    propertyTitle: 'Apt Jardins 3q',
    propertyAddress: 'Alameda Lorena, 1420',
    amount: 4500,
    transactionKind: 'rent',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-02-12',
    createdLabel: '12 Fev 2025',
  },
  {
    sequence: 41,
    leadName: 'Camila Rodrigues',
    leadEmail: 'camila@yahoo.com',
    propertyTitle: 'Casa Condomínio Alphaville',
    propertyAddress: 'Av. das Flores, 880',
    amount: 1_850_000,
    transactionKind: 'sale',
    status: 'ACEITA',
    createdAt: '2025-02-10',
    createdLabel: '10 Fev 2025',
  },
  {
    sequence: 40,
    leadName: 'Diego Souza',
    leadEmail: 'diego.souza@gmail.com',
    propertyTitle: 'Studio Pinheiros',
    propertyAddress: 'Rua Cunha Gago, 350',
    amount: 3200,
    transactionKind: 'rent',
    status: 'ENVIADA',
    createdAt: '2025-02-08',
    createdLabel: '08 Fev 2025',
  },
  {
    sequence: 39,
    leadName: 'Patricia Lima',
    leadEmail: 'patricia.lima@outlook.com',
    propertyTitle: 'Cobertura Moema 4q',
    propertyAddress: 'Av. Moema, 1200',
    amount: 4_200_000,
    transactionKind: 'sale',
    status: 'RECUSADA',
    createdAt: '2025-02-05',
    createdLabel: '05 Fev 2025',
  },
  {
    sequence: 38,
    leadName: 'Ricardo Alves',
    leadEmail: 'ricardo@alves.com.br',
    propertyTitle: 'Apt Brooklin 2q',
    propertyAddress: 'Rua Indiana, 95',
    amount: 3800,
    transactionKind: 'rent',
    status: 'RASCUNHO',
    createdAt: '2025-02-01',
    createdLabel: '01 Fev 2025',
  },
  {
    sequence: 37,
    leadName: 'Fernanda Reis',
    leadEmail: 'fernanda.reis@email.com',
    propertyTitle: 'Apartamento Vila Mariana',
    propertyAddress: 'Rua Joaquim Távora, 640',
    amount: 5100,
    transactionKind: 'rent',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-30',
    createdLabel: '30 Jan 2025',
  },
  {
    sequence: 36,
    leadName: 'Lucas Ferreira',
    leadEmail: 'lucas.ferreira@email.com',
    propertyTitle: 'Casa Alto de Pinheiros',
    propertyAddress: 'Rua Pio XI, 810',
    amount: 2_150_000,
    transactionKind: 'sale',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-28',
    createdLabel: '28 Jan 2025',
  },
  {
    sequence: 35,
    leadName: 'Mariana Gomes',
    leadEmail: 'mariana.gomes@email.com',
    propertyTitle: 'Loft Bela Vista',
    propertyAddress: 'Rua Pamplona, 230',
    amount: 4300,
    transactionKind: 'rent',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-25',
    createdLabel: '25 Jan 2025',
  },
  {
    sequence: 34,
    leadName: 'Rafael Nunes',
    leadEmail: 'rafael.nunes@email.com',
    propertyTitle: 'Apartamento Perdizes',
    propertyAddress: 'Rua Cayowaá, 1140',
    amount: 6200,
    transactionKind: 'rent',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-23',
    createdLabel: '23 Jan 2025',
  },
  {
    sequence: 33,
    leadName: 'Beatriz Martins',
    leadEmail: 'beatriz.martins@email.com',
    propertyTitle: 'Casa Campo Belo',
    propertyAddress: "Rua Gabriele D'Annunzio, 515",
    amount: 1_620_000,
    transactionKind: 'sale',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-20',
    createdLabel: '20 Jan 2025',
  },
  {
    sequence: 32,
    leadName: 'André Ribeiro',
    leadEmail: 'andre.ribeiro@email.com',
    propertyTitle: 'Studio Vila Madalena',
    propertyAddress: 'Rua Harmonia, 286',
    amount: 3900,
    transactionKind: 'rent',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-18',
    createdLabel: '18 Jan 2025',
  },
  {
    sequence: 31,
    leadName: 'Juliana Castro',
    leadEmail: 'juliana.castro@email.com',
    propertyTitle: 'Cobertura Itaim 3q',
    propertyAddress: 'Rua Bandeira Paulista, 920',
    amount: 3_450_000,
    transactionKind: 'sale',
    status: 'EM_NEGOCIACAO',
    createdAt: '2025-01-16',
    createdLabel: '16 Jan 2025',
  },
  {
    sequence: 30,
    leadName: 'Thiago Mendes',
    leadEmail: 'thiago.mendes@email.com',
    propertyTitle: 'Apartamento Tatuapé',
    propertyAddress: 'Rua Itapura, 450',
    amount: 4700,
    transactionKind: 'rent',
    status: 'ENVIADA',
    createdAt: '2025-01-14',
    createdLabel: '14 Jan 2025',
  },
  {
    sequence: 29,
    leadName: 'Aline Cardoso',
    leadEmail: 'aline.cardoso@email.com',
    propertyTitle: 'Casa Granja Viana',
    propertyAddress: 'Alameda das Acácias, 115',
    amount: 1_380_000,
    transactionKind: 'sale',
    status: 'ENVIADA',
    createdAt: '2025-01-12',
    createdLabel: '12 Jan 2025',
  },
  {
    sequence: 28,
    leadName: 'Gustavo Moreira',
    leadEmail: 'gustavo.moreira@email.com',
    propertyTitle: 'Studio Consolação',
    propertyAddress: 'Rua Augusta, 760',
    amount: 3500,
    transactionKind: 'rent',
    status: 'ENVIADA',
    createdAt: '2025-01-10',
    createdLabel: '10 Jan 2025',
  },
  {
    sequence: 27,
    leadName: 'Cláudia Ramos',
    leadEmail: 'claudia.ramos@email.com',
    propertyTitle: 'Apartamento Santana',
    propertyAddress: 'Rua Voluntários da Pátria, 1880',
    amount: 4200,
    transactionKind: 'rent',
    status: 'ENVIADA',
    createdAt: '2025-01-08',
    createdLabel: '08 Jan 2025',
  },
  {
    sequence: 26,
    leadName: 'Eduardo Freitas',
    leadEmail: 'eduardo.freitas@email.com',
    propertyTitle: 'Sala Comercial Paulista',
    propertyAddress: 'Av. Paulista, 1650',
    amount: 860_000,
    transactionKind: 'sale',
    status: 'ENVIADA',
    createdAt: '2025-01-06',
    createdLabel: '06 Jan 2025',
  },
  {
    sequence: 25,
    leadName: 'Isabela Rocha',
    leadEmail: 'isabela.rocha@email.com',
    propertyTitle: 'Studio República',
    propertyAddress: 'Av. Ipiranga, 333',
    amount: 250_000,
    transactionKind: 'sale',
    status: 'ACEITA',
    createdAt: '2025-01-04',
    createdLabel: '04 Jan 2025',
  },
  {
    sequence: 24,
    leadName: 'João Vilela',
    leadEmail: 'joao.vilela@email.com',
    propertyTitle: 'Apartamento Centro',
    propertyAddress: 'Rua da Consolação, 210',
    amount: 175_000,
    transactionKind: 'sale',
    status: 'ACEITA',
    createdAt: '2025-01-02',
    createdLabel: '02 Jan 2025',
  },
  {
    sequence: 23,
    leadName: 'Natália Moura',
    leadEmail: 'natalia.moura@email.com',
    propertyTitle: 'Kitnet Liberdade',
    propertyAddress: 'Rua Galvão Bueno, 510',
    amount: 125_000,
    transactionKind: 'sale',
    status: 'ACEITA',
    createdAt: '2024-12-29',
    createdLabel: '29 Dez 2024',
  },
  {
    sequence: 22,
    leadName: 'Paulo Henrique',
    leadEmail: 'paulo.henrique@email.com',
    propertyTitle: 'Casa Vila Leopoldina',
    propertyAddress: 'Rua Carlos Weber, 735',
    amount: 1_730_000,
    transactionKind: 'sale',
    status: 'RECUSADA',
    createdAt: '2024-12-27',
    createdLabel: '27 Dez 2024',
  },
  {
    sequence: 21,
    leadName: 'Larissa Alves',
    leadEmail: 'larissa.alves@email.com',
    propertyTitle: 'Apartamento Aclimação',
    propertyAddress: 'Rua Muniz de Sousa, 890',
    amount: 4900,
    transactionKind: 'rent',
    status: 'RECUSADA',
    createdAt: '2024-12-23',
    createdLabel: '23 Dez 2024',
  },
  {
    sequence: 20,
    leadName: 'Marcelo Teixeira',
    leadEmail: 'marcelo.teixeira@email.com',
    propertyTitle: 'Loft Brooklin',
    propertyAddress: 'Rua Flórida, 1560',
    amount: 5600,
    transactionKind: 'rent',
    status: 'RASCUNHO',
    createdAt: '2024-12-20',
    createdLabel: '20 Dez 2024',
  },
] as const

export const proposalManagementFixtures: readonly ProposalManagementListItem[] =
  proposalFixtureInputs.map(createProposalFixture)

export const proposalManagementFirstPageFixtures = proposalManagementFixtures.slice(0, 5)

function countStatuses(
  proposals: readonly ProposalManagementListItem[],
): ProposalManagementStatusCounts {
  const counts: Record<ProposalManagementStatus, number> = {
    EM_NEGOCIACAO: 0,
    ENVIADA: 0,
    ACEITA: 0,
    RECUSADA: 0,
    RASCUNHO: 0,
  }

  proposals.forEach((proposal) => {
    counts[proposal.status] += 1
  })

  return counts
}

const proposalStatusCounts = countStatuses(proposalManagementFixtures)
const acceptedTotalAmount = proposalManagementFixtures
  .filter(({ status }) => status === 'ACEITA')
  .reduce((total, proposal) => total + proposal.amount, 0)

export const proposalManagementSummary: ProposalManagementSummary = {
  totalCount: proposalManagementFixtures.length,
  statusCounts: proposalStatusCounts,
  negotiationCount: proposalStatusCounts.EM_NEGOCIACAO,
  acceptedTotalAmount,
  acceptedTotalLabel: 'R$ 2.4M',
  conversionRate: 38,
  conversionRateLabel: '38%',
}

function createDefaultDetail(proposal: ProposalManagementListItem): ProposalManagementDetail {
  const isRental = proposal.transactionKind === 'rent'
  const statusLabel = proposalStatusPresentations[proposal.status].label

  return {
    proposal,
    contractTermMonths: isRental ? 30 : null,
    contractTermLabel: isRental ? '30 meses' : 'Não se aplica',
    intendedStartDate: '2025-03-15',
    intendedStartDateLabel: '15/03/2025',
    guaranteeLabel: isRental ? 'Seguro-fiança' : 'Não se aplica',
    observations: `${proposal.lead.name} demonstrou interesse em ${proposal.property.title}.`,
    specialConditions: [],
    broker: marinaCosta,
    history: [
      {
        id: `${proposal.id}-current-status`,
        title: statusLabel,
        description: 'Status atual da proposta',
        dateLabel: proposal.createdLabel,
        isCurrent: true,
      },
      {
        id: `${proposal.id}-created`,
        title: 'Proposta criada',
        description: 'Por Marina Costa',
        dateLabel: proposal.createdLabel,
        isCurrent: false,
      },
    ],
  }
}

function createFeaturedDetail(proposal: ProposalManagementListItem): ProposalManagementDetail {
  return {
    proposal,
    contractTermMonths: 30,
    contractTermLabel: '30 meses',
    intendedStartDate: '2025-03-01',
    intendedStartDateLabel: '01/03/2025',
    guaranteeLabel: 'Fiador',
    observations:
      'Inquilino prefere incluir vaga de garagem adicional se disponível para locação interna.',
    specialConditions: [
      'Permissão para animais de estimação (2 cães de pequeno porte).',
      'Pintura completa na saída com a mesma marca e código de cores atual.',
      'Desconto de 5% sobre o valor do aluguel para pagamento até o dia 25 de cada mês antecedente.',
    ],
    broker: marinaCosta,
    history: [
      {
        id: 'prp-0042-negotiation',
        title: 'Em negociação',
        description: 'Inquilino solicitou garagem',
        dateLabel: 'Hoje, 14:20',
        isCurrent: true,
      },
      {
        id: 'prp-0042-counteroffer',
        title: 'Contraproposta recebida',
        description: 'Proprietário alterou condições',
        dateLabel: 'Ontem, 11:15',
        isCurrent: false,
      },
      {
        id: 'prp-0042-sent',
        title: 'Enviada ao proprietário',
        description: 'Aguardando retorno formal',
        dateLabel: '11 Fev, 09:30',
        isCurrent: false,
      },
      {
        id: 'prp-0042-created',
        title: 'Proposta criada',
        description: 'Por Marina Costa',
        dateLabel: '10 Fev, 17:00',
        isCurrent: false,
      },
    ],
  }
}

export const featuredProposalId = 'prp-0042'

export const proposalManagementDetailsById: Readonly<Record<string, ProposalManagementDetail>> =
  Object.fromEntries(
    proposalManagementFixtures.map((proposal) => [
      proposal.id,
      proposal.id === featuredProposalId
        ? createFeaturedDetail(proposal)
        : createDefaultDetail(proposal),
    ]),
  )

export function getProposalManagementDetail(
  proposalId: string,
): ProposalManagementDetail | undefined {
  return proposalManagementDetailsById[proposalId]
}
