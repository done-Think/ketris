import { describe, expect, it } from 'vitest'

import { brand, supportColor } from '@shared/theme/tokens'

import {
  proposalManagementStatuses,
  proposalStatusFilters,
  proposalStatusPresentations,
} from '../../config/proposal-statuses'
import {
  featuredProposalId,
  getProposalManagementDetail,
  proposalManagementDetailsById,
  proposalManagementFirstPageFixtures,
  proposalManagementFixtures,
  proposalManagementSummary,
} from '../../fixtures/proposal-management-fixtures'
import {
  filterProposalManagementItems,
  paginateProposalManagementItems,
  queryProposalManagementItems,
} from '../../utils/proposal-management'

describe('proposal management fixtures', () => {
  it('provides all 23 proposals in the requested status distribution', () => {
    expect(proposalManagementFixtures).toHaveLength(23)
    expect(proposalManagementSummary.statusCounts).toEqual({
      EM_NEGOCIACAO: 8,
      ENVIADA: 6,
      ACEITA: 4,
      RECUSADA: 3,
      RASCUNHO: 2,
    })
    expect(
      Object.values(proposalManagementSummary.statusCounts).reduce(
        (total, count) => total + count,
        0,
      ),
    ).toBe(23)
  })

  it('keeps the visual reference records on the first page in the exact order', () => {
    expect(proposalManagementFirstPageFixtures.map(({ reference }) => reference)).toEqual([
      '#PRP-0042',
      '#PRP-0041',
      '#PRP-0040',
      '#PRP-0039',
      '#PRP-0038',
    ])

    expect(proposalManagementFirstPageFixtures).toEqual([
      expect.objectContaining({
        id: 'prp-0042',
        lead: expect.objectContaining({ name: 'Bruno Oliveira', email: 'bruno@fintrex.com' }),
        property: expect.objectContaining({
          title: 'Apt Jardins 3q',
          address: 'Alameda Lorena, 1420',
        }),
        valueLabel: 'R$ 4.500/mês',
        status: 'EM_NEGOCIACAO',
        createdLabel: '12 Fev 2025',
      }),
      expect.objectContaining({
        reference: '#PRP-0041',
        lead: expect.objectContaining({ name: 'Camila Rodrigues', email: 'camila@yahoo.com' }),
        property: expect.objectContaining({ title: 'Casa Condomínio Alphaville' }),
        valueLabel: 'R$ 1.850.000',
        status: 'ACEITA',
      }),
      expect.objectContaining({ reference: '#PRP-0040', status: 'ENVIADA' }),
      expect.objectContaining({ reference: '#PRP-0039', status: 'RECUSADA' }),
      expect.objectContaining({ reference: '#PRP-0038', status: 'RASCUNHO' }),
    ])
  })

  it('exposes the exact KPI summary from the reference', () => {
    expect(proposalManagementSummary).toMatchObject({
      totalCount: 23,
      negotiationCount: 8,
      acceptedTotalAmount: 2_400_000,
      acceptedTotalLabel: 'R$ 2.4M',
      conversionRate: 38,
      conversionRateLabel: '38%',
    })
  })

  it('provides the exact featured detail and structured details for every proposal', () => {
    const detail = getProposalManagementDetail(featuredProposalId)

    expect(detail).toMatchObject({
      proposal: expect.objectContaining({
        id: 'prp-0042',
        reference: '#PRP-0042',
        status: 'EM_NEGOCIACAO',
      }),
      contractTermMonths: 30,
      contractTermLabel: '30 meses',
      intendedStartDateLabel: '01/03/2025',
      guaranteeLabel: 'Fiador',
      broker: expect.objectContaining({
        name: 'Marina Costa',
        email: 'marina.costa@ketris.com',
      }),
    })
    expect(detail?.specialConditions).toHaveLength(3)
    expect(detail?.history).toHaveLength(4)
    expect(detail?.history.filter(({ isCurrent }) => isCurrent)).toHaveLength(1)

    expect(Object.keys(proposalManagementDetailsById)).toHaveLength(23)
    proposalManagementFixtures.forEach((proposal) => {
      const proposalDetail = getProposalManagementDetail(proposal.id)

      expect(proposalDetail?.proposal).toBe(proposal)
      expect(proposalDetail?.broker.name).toBe('Marina Costa')
      expect(proposalDetail?.history.length).toBeGreaterThan(0)
    })
    expect(getProposalManagementDetail('unknown-proposal')).toBeUndefined()
  })
})

describe('proposal management status configuration', () => {
  it('keeps the reference order, labels, and theme-token colors', () => {
    expect(proposalManagementStatuses).toEqual([
      'EM_NEGOCIACAO',
      'ENVIADA',
      'ACEITA',
      'RECUSADA',
      'RASCUNHO',
    ])
    expect(proposalStatusFilters.map(({ label }) => label)).toEqual([
      'Todas',
      'Em negociação',
      'Enviada',
      'Aceita',
      'Recusada',
      'Rascunho',
    ])
    expect(proposalStatusPresentations).toMatchObject({
      EM_NEGOCIACAO: {
        color: brand.semantic.warning,
        backgroundColor: supportColor.warningSoft,
      },
      ENVIADA: { color: brand.semantic.info, backgroundColor: supportColor.infoSoft },
      ACEITA: { color: brand.semantic.success, backgroundColor: supportColor.successSoft },
      RECUSADA: { color: brand.magenta[700], backgroundColor: brand.magenta[50] },
      RASCUNHO: { color: brand.neutral[600], backgroundColor: brand.neutral[50] },
    })
  })
})

describe('proposal management querying', () => {
  it('searches normalized proposal, lead, email, property, and address fields', () => {
    expect(
      filterProposalManagementItems(proposalManagementFixtures, 'PRP-0042').map(({ id }) => id),
    ).toEqual(['prp-0042'])
    expect(
      filterProposalManagementItems(proposalManagementFixtures, 'patricia').map(({ id }) => id),
    ).toEqual(['prp-0039'])
    expect(
      filterProposalManagementItems(proposalManagementFixtures, 'fintrex').map(({ id }) => id),
    ).toEqual(['prp-0042'])
    expect(
      filterProposalManagementItems(proposalManagementFixtures, 'condominio alphaville').map(
        ({ id }) => id,
      ),
    ).toEqual(['prp-0041'])
    expect(
      filterProposalManagementItems(proposalManagementFixtures, 'cunha gago').map(({ id }) => id),
    ).toEqual(['prp-0040'])
  })

  it('filters by status without mutating the source collection', () => {
    const originalOrder = proposalManagementFixtures.map(({ id }) => id)
    const accepted = filterProposalManagementItems(proposalManagementFixtures, '', 'ACEITA')

    expect(accepted).toHaveLength(4)
    expect(accepted.every(({ status }) => status === 'ACEITA')).toBe(true)
    expect(proposalManagementFixtures.map(({ id }) => id)).toEqual(originalOrder)
  })

  it('paginates the full collection and clamps invalid pages', () => {
    const firstPage = paginateProposalManagementItems(proposalManagementFixtures)
    const lastPage = paginateProposalManagementItems(proposalManagementFixtures, 5, 5)
    const clampedPage = paginateProposalManagementItems(proposalManagementFixtures, 99, 5)

    expect(firstPage).toMatchObject({
      page: 1,
      pageSize: 5,
      pageCount: 5,
      totalCount: 23,
      firstItem: 1,
      lastItem: 5,
    })
    expect(firstPage.items.map(({ reference }) => reference)).toEqual([
      '#PRP-0042',
      '#PRP-0041',
      '#PRP-0040',
      '#PRP-0039',
      '#PRP-0038',
    ])
    expect(lastPage.items).toHaveLength(3)
    expect(lastPage).toMatchObject({ firstItem: 21, lastItem: 23 })
    expect(clampedPage.page).toBe(5)
  })

  it('combines search, status filtering, and pagination in a single query', () => {
    const result = queryProposalManagementItems(proposalManagementFixtures, {
      search: 'apartamento',
      status: 'ENVIADA',
      page: 1,
      pageSize: 2,
    })

    expect(result.totalCount).toBe(2)
    expect(result.items).toHaveLength(2)
    expect(result.items.every(({ status }) => status === 'ENVIADA')).toBe(true)
    expect(result.items.map(({ reference }) => reference)).toEqual(['#PRP-0030', '#PRP-0027'])
  })
})
