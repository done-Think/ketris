import { describe, expect, it } from 'vitest'

import {
  matchesTeamSearch,
  responseTimeParts,
  teamMemberContactLinks,
  teamMemberMenuActions,
  teamMemberState,
  transferDestinations,
} from '../../utils/team-member'
import { teamMember } from '../fixtures/team-member'

const invitation = {
  status: 'PENDING' as const,
  sentAt: '2026-10-20T12:00:00.000Z',
  expiresAt: '2026-10-27T12:00:00.000Z',
}

describe('team member utils', () => {
  it('derives the member state and the menu actions for it', () => {
    expect(teamMemberState(teamMember())).toBe('active')
    expect(teamMemberState(teamMember({ active: false }))).toBe('inactive')
    expect(teamMemberState(teamMember({ invitation }))).toBe('invited')
    expect(teamMemberMenuActions(teamMember())).toEqual([
      'performance',
      'editGoal',
      'transferPortfolio',
      'scheduleOneOnOne',
      'deactivate',
    ])
    expect(teamMemberMenuActions(teamMember({ active: false }))).toContain('activate')
    expect(teamMemberMenuActions(teamMember({ invitation }))).toEqual([
      'resendInvitation',
      'cancelInvitation',
    ])
  })

  it('builds contact links with the Brazilian country code and hides phone links without a phone', () => {
    expect(teamMemberContactLinks(teamMember())).toEqual({
      whatsapp: 'https://wa.me/5511988887777',
      email: 'mailto:marina@ketris.dev',
      call: 'tel:+5511988887777',
    })
    expect(teamMemberContactLinks(teamMember({ phone: '+351 912 345 678 90' })).whatsapp).toBe(
      'https://wa.me/35191234567890',
    )
    expect(teamMemberContactLinks(teamMember({ phone: null }))).toMatchObject({
      whatsapp: null,
      call: null,
    })
  })

  it('searches by name, e-mail, headline and specialty ignoring accents', () => {
    const member = teamMember({ name: 'João Araújo', specialties: ['Locação'] })

    expect(matchesTeamSearch(member, 'joao')).toBe(true)
    expect(matchesTeamSearch(member, 'LOCACAO')).toBe(true)
    expect(matchesTeamSearch(member, 'marina@')).toBe(true)
    expect(matchesTeamSearch(member, 'comercial')).toBe(false)
    expect(matchesTeamSearch(member, '  ')).toBe(true)
  })

  it('offers only other active brokers and the current owner as destinations', () => {
    const members = [
      teamMember({ id: 'a' }),
      teamMember({ id: 'b', name: 'Bruno' }),
      teamMember({ id: 'c', active: false }),
      teamMember({ id: 'd', invitation }),
    ]
    const self = { id: 'owner', label: 'Ana (você)' }

    expect(transferDestinations(members, 'a', self)).toEqual([self, { id: 'b', label: 'Bruno' }])
    expect(transferDestinations(members, 'owner', self)).toHaveLength(2)
    expect(transferDestinations(members, 'a', null)).toEqual([{ id: 'b', label: 'Bruno' }])
  })

  it('splits the response time into a readable unit', () => {
    expect(responseTimeParts(45)).toEqual({ unit: 'minutes', minutes: 45 })
    expect(responseTimeParts(95)).toEqual({ unit: 'hours', hours: 1, minutes: 35 })
    expect(responseTimeParts(60 * 60)).toEqual({ unit: 'days', days: 3 })
  })
})
